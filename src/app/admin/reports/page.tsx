import { Prisma } from "@prisma/client";
import { memberDisplayName, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { walkStatus } from "@/lib/walk-window";
import { AdminPageIntro } from "../admin-page-intro";
import { AccidentReportManager } from "./report-manager";

type LinkFilter = "all" | "linked" | "unlinked";
type SortOrder = "desc" | "asc";

/** Cap for client-side search — enough for a small group without putting PII in ?q=. */
const REPORTS_FETCH_LIMIT = 500;

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

export const dynamic = "force-dynamic";

export default async function AccidentReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string; sort?: string }>;
}) {
  await requireAdmin();
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
      include: {
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
      <AdminPageIntro
        description="Record what happened, who was involved, and what you did. Filter by linked walk, sort by date, or search. Open a report to read the full write-up, then edit it or print a PDF."
        title="Accident reports"
      />
      <AccidentReportManager
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
