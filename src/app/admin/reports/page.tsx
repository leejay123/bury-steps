import { Suspense } from "react";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { AdminPageFallback } from "@/app/admin/admin-page-fallback";
import { ReportsFilterChrome } from "@/components/list-chrome";
import { RememberListCount } from "@/components/remember-list-count";
import { ReportRowsSkeleton } from "@/components/list-skeletons";
import { reportsListRows } from "@/lib/list-counts";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { Prisma } from "@prisma/client";
import { getOptionalAdmin, memberDisplayName } from "@/lib/auth";
import { notFound } from "next/navigation";
import { cacheLife } from "next/cache";
import { prisma } from "@/lib/db";
import { walkStatus } from "@/lib/walk-window";
import { AccidentReportManager } from "./report-manager";

type LinkFilter = "all" | "linked" | "unlinked";
type SortOrder = "desc" | "asc";

/** Cap for client-side search — enough for a small group without putting PII in ?q=. */
const REPORTS_FETCH_LIMIT = 500;

const REPORTS_INTRO =
  "Record what happened, who was involved, and what you did. Filter by linked walk, sort by date, or search. Open a report to read the full write-up, then edit it or print a PDF.";

function parseLinkFilter(raw: string | undefined): LinkFilter {
  if (raw === "linked" || raw === "unlinked") return raw;
  return "all";
}

function parseSort(raw: string | undefined): SortOrder {
  return raw === "asc" ? "asc" : "desc";
}

function buildWhere(link: LinkFilter): Prisma.AccidentReportWhereInput | undefined {
  if (link === "linked") return { walkId: { not: null } };
  if (link === "unlinked") return { walkId: null };
  return undefined;
}


/**
 * The Reports list for one filter and sort, as a private saved copy: kept
 * in this browser only for five minutes (never on the server), so the page
 * fetched ahead from the menu can carry it and opens with no placeholder.
 * Saving or deleting a report refreshes it at once. See node_modules/next/
 * dist/docs/01-app/02-guides/optimizing-prefetching.md.
 */
async function getReportsView(link: LinkFilter, sort: ReturnType<typeof parseSort>) {
  "use cache: private";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  const admin = await getOptionalAdmin();
  if (!admin?.permReportsView) return null;
  const canDelete = admin.isOwner;
  const where = buildWhere(link);

  const [totalReports, reports, walks] = await Promise.all([
    prisma.accidentReport.count(),
    prisma.accidentReport.findMany({
      where,
      orderBy: { happenedAt: sort },
      take: REPORTS_FETCH_LIMIT,
      select: {
        id: true,
        happenedAt: true,
        walkId: true,
        whatHappened: true,
        whoInvolved: true,
        whatWeDid: true,
        organiserNotes: true,
        retentionLocked: true,
        walk: { select: { id: true, title: true, location: true } },
        involvedMembers: {
          select: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    }),
    prisma.walk.findMany({
      orderBy: { startsAt: "desc" },
      take: 200,
      select: {
        id: true,
        title: true,
        startsAt: true,
        durationMins: true,
        endedAt: true,
        cancelledAt: true,
      },
    }),
  ]);

  // An accident report is about something that happened on a walk — a walk
  // that hasn't started yet (or was cancelled) can't be linked to one. One
  // still in progress can: the report is often written up on the day.
  const linkableWalks = walks.filter((walk) => {
    const status = walkStatus(walk);
    return status === "completed" || status === "in-progress";
  });

  const permissions = {
    canCreate: admin.permReportsCreate,
    canEdit: admin.permReportsEdit,
    canViewMembers: admin.permMembersView,
  };
  return { canDelete, permissions, totalReports, reports, linkableWalks };
}

async function AccidentReportsPageContent({
  searchParams,
}: {
  searchParams: Promise<{ link?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const link = parseLinkFilter(params.link);
  const sort = parseSort(params.sort);
  const view = await getReportsView(link, sort);
  if (!view) notFound();
  const { canDelete, permissions, totalReports, reports, linkableWalks } = view;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <RememberListCount count={totalReports === 0 ? 0 : Math.min(reports.length, LIST_PAGE_SIZE)} id="reports" />
      <AccidentReportManager
        intro={{
          title: "Accident reports",
          description: REPORTS_INTRO,
        }}
        canCreate={permissions.canCreate}
        canDelete={canDelete}
        canEdit={permissions.canEdit}
        canViewMembers={permissions.canViewMembers}
        hasAnyReports={totalReports > 0}
        linkFilter={link}
        reports={reports.map((report) => ({
          id: report.id,
          happenedAt: report.happenedAt.toISOString(),
          walkId: report.walkId,
          walkTitle: report.walk?.title ?? null,
          walkLocation: report.walk?.location ?? null,
          whatHappened: report.whatHappened,
          whoInvolved: report.whoInvolved,
          involvedMembers: report.involvedMembers.map((row) => ({
            id: row.user.id,
            name: memberDisplayName(row.user),
          })),
          whatWeDid: report.whatWeDid,
          organiserNotes: report.organiserNotes,
          retentionLocked: report.retentionLocked,
        }))}
        sortOrder={sort}
        walks={linkableWalks.map((walk) => ({
          id: walk.id,
          title: walk.title,
          startsAt: walk.startsAt.toISOString(),
        }))}
      />
    </div>
  );
}

/** Real title, search and filters, then exactly as many report rows as
 * there are (list-counts.ts) — one placeholder from the first paint. */
export async function ReportsPageFallback() {
  const rows = await reportsListRows();
  return (
    <AdminPageFallback
      description={REPORTS_INTRO}
      filters={<ReportsFilterChrome />}
      list={<ReportRowsSkeleton known={rows} remember="reports" />}
      title="Accident reports"
    />
  );
}

/** Everything here depends on who's asking and on live data, so the page
 * shows a matching placeholder for an instant while it loads. */
/** Fetched ahead from the menu (navLinkPrefetch), so it opens with the reports there. */
export const prefetch = "partial";

export default function AccidentReportsPage(props: Parameters<typeof AccidentReportsPageContent>[0]) {
  return (
    <Suspense fallback={<ReportsPageFallback />}>
      <PlaceholderPreview fallback={<ReportsPageFallback />}>
        <AccidentReportsPageContent {...props} />
      </PlaceholderPreview>
    </Suspense>
  );
}
