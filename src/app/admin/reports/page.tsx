import { Suspense } from "react";
import { AdminPageFallback } from "@/app/admin/admin-page-fallback";
import { ReportsFilterChrome } from "@/components/list-chrome";
import { RememberListCount } from "@/components/remember-list-count";
import { ReportRowsSkeleton } from "@/components/list-skeletons";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { rememberedCount } from "@/lib/remembered-rows";
import { Prisma } from "@prisma/client";
import { memberDisplayName, requirePermission } from "@/lib/auth";
import { isOwner } from "@/lib/site-owner";
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


async function AccidentReportsPageContent({
  searchParams,
}: {
  searchParams: Promise<{ link?: string; sort?: string }>;
}) {
  const admin = await requirePermission("permReportsView");
  const canDelete = await isOwner(admin.id);
  const params = await searchParams;
  const link = parseLinkFilter(params.link);
  const sort = parseSort(params.sort);
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
  // that hasn't started yet (or was cancelled) can't be linked to one.
  const completedWalks = walks.filter((walk) => walkStatus(walk) === "completed");

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <RememberListCount count={totalReports === 0 ? 0 : Math.min(reports.length, LIST_PAGE_SIZE)} id="reports" />
      <AccidentReportManager
        intro={{
          title: "Accident reports",
          description: REPORTS_INTRO,
        }}
        canCreate={admin.permReportsCreate}
        canDelete={canDelete}
        canEdit={admin.permReportsEdit}
        canViewMembers={admin.permMembersView}
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
        walks={completedWalks.map((walk) => ({
          id: walk.id,
          title: walk.title,
          startsAt: walk.startsAt.toISOString(),
        }))}
      />
    </div>
  );
}

/** Real title, search and filters. Grey rows only for the reports last shown. */
export function ReportsPageFallback({ rows }: { rows: number | null }) {
  return (
    <AdminPageFallback
      description={REPORTS_INTRO}
      filters={rows === 0 ? null : <ReportsFilterChrome />}
      list={<ReportRowsSkeleton rows={rows ?? 0} />}
      title="Accident reports"
    />
  );
}

/** Everything here depends on who's asking and on live data, so the page
 * shows a matching placeholder for an instant while it loads. */
export default function AccidentReportsPage(props: Parameters<typeof AccidentReportsPageContent>[0]) {
  return (
    <Suspense fallback={<ReportsPageFallback rows={null} />}>
      <ReportsCounted {...props} />
    </Suspense>
  );
}

async function ReportsCounted(props: Parameters<typeof AccidentReportsPageContent>[0]) {
  const rows = await rememberedCount("reports");
  return (
    <Suspense fallback={<ReportsPageFallback rows={rows} />}>
      <AccidentReportsPageContent {...props} />
    </Suspense>
  );
}
