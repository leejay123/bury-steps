import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { AdminPageIntro } from "../admin-page-intro";
import { AccidentReportManager } from "./report-manager";

type LinkFilter = "all" | "linked" | "unlinked";
type SortOrder = "desc" | "asc";

function parseLinkFilter(raw: string | undefined): LinkFilter {
  if (raw === "linked" || raw === "unlinked") return raw;
  return "all";
}

function parseSort(raw: string | undefined): SortOrder {
  return raw === "asc" ? "asc" : "desc";
}

function buildWhere(
  query: string,
  link: LinkFilter,
): Prisma.AccidentReportWhereInput | undefined {
  const parts: Prisma.AccidentReportWhereInput[] = [];

  if (query) {
    parts.push({
      OR: [
        { whatHappened: { contains: query, mode: "insensitive" } },
        { whoInvolved: { contains: query, mode: "insensitive" } },
        { whatWeDid: { contains: query, mode: "insensitive" } },
        { organiserNotes: { contains: query, mode: "insensitive" } },
        { walk: { title: { contains: query, mode: "insensitive" } } },
        { walk: { location: { contains: query, mode: "insensitive" } } },
      ],
    });
  }

  if (link === "linked") parts.push({ walkId: { not: null } });
  if (link === "unlinked") parts.push({ walkId: null });

  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

export const dynamic = "force-dynamic";

export default async function AccidentReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; link?: string; sort?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const link = parseLinkFilter(params.link);
  const sort = parseSort(params.sort);
  const requestedPage = Math.max(1, Number(params.page ?? "1") || 1);
  const where = buildWhere(query, link);

  const [totalReports, matchedTotal, walks] = await Promise.all([
    prisma.accidentReport.count(),
    prisma.accidentReport.count({ where }),
    prisma.walk.findMany({
      orderBy: { startsAt: "desc" },
      take: 200,
      select: { id: true, title: true, startsAt: true },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(matchedTotal / LIST_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);

  const reports = await prisma.accidentReport.findMany({
    where,
    orderBy: { happenedAt: sort },
    skip: (page - 1) * LIST_PAGE_SIZE,
    take: LIST_PAGE_SIZE,
    include: {
      walk: { select: { id: true, title: true, location: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <AdminPageIntro
        description="Record what happened, who was involved, and what you did. Filter by linked walk, sort by date, or search. Open a report to read the full write-up, then edit it or print a PDF."
        title="Accident reports"
      />
      <AccidentReportManager
        hasAnyReports={totalReports > 0}
        linkFilter={link}
        page={page}
        pageCount={pageCount}
        pageSize={LIST_PAGE_SIZE}
        reports={reports.map((report) => ({
          id: report.id,
          happenedAt: report.happenedAt.toISOString(),
          walkId: report.walkId,
          walkTitle: report.walk?.title ?? null,
          walkLocation: report.walk?.location ?? null,
          whatHappened: report.whatHappened,
          whoInvolved: report.whoInvolved,
          whatWeDid: report.whatWeDid,
          organiserNotes: report.organiserNotes,
        }))}
        sortOrder={sort}
        total={matchedTotal}
        walks={walks.map((walk) => ({
          id: walk.id,
          title: walk.title,
          startsAt: walk.startsAt.toISOString(),
        }))}
      />
    </div>
  );
}
