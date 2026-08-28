import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminPageIntro } from "../admin-page-intro";
import { AccidentReportManager } from "./report-manager";

export const dynamic = "force-dynamic";

export default async function AccidentReportsPage() {
  await requireAdmin();

  const [reports, walks] = await Promise.all([
    prisma.accidentReport.findMany({
      orderBy: { happenedAt: "desc" },
      include: {
        walk: { select: { id: true, title: true, location: true } },
      },
    }),
    prisma.walk.findMany({
      orderBy: { startsAt: "desc" },
      take: 50,
      select: { id: true, title: true, startsAt: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <AdminPageIntro
        description="Record what happened, who was involved, and what you did. Open a report to read the full write-up, then edit it or print a PDF."
        title="Accident reports"
      />
      <AccidentReportManager
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
        walks={walks.map((walk) => ({
          id: walk.id,
          title: walk.title,
          startsAt: walk.startsAt.toISOString(),
        }))}
      />
    </div>
  );
}
