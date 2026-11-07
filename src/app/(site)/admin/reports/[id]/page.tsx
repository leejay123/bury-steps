import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { displayName, getOptionalAdmin, getOptionalUser, memberDisplayName } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { walkStatus } from "@/lib/walk-window";
import { EdgeBar } from "@/components/edge-search";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageIntro } from "../../admin-page-intro";
import { SettingsSection } from "../../settings/settings-page";
import { ReportPage } from "./report-page";

// The tab says "Accident report" only to an organiser looking at a real report (as the
// print page does); anyone else, or a link to one that has gone, gets the plain site name.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const user = await getOptionalUser();
  if (user?.role !== "ADMIN") return {};
  const { id } = await params;
  const report = await prisma.accidentReport.findUnique({
    where: { id },
    select: { reportNumber: true },
  });
  if (!report) return {};
  return { title: report.reportNumber ? `Accident report ${report.reportNumber}` : "Accident report" };
}

async function ReportPageContent({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getOptionalAdmin();
  if (!admin?.permReportsView) notFound();
  const { id } = await params;

  const [report, walks] = await Promise.all([
    prisma.accidentReport.findUnique({
      where: { id },
      select: {
        id: true,
        reportNumber: true,
        happenedAt: true,
        walkId: true,
        whatHappened: true,
        whoInvolved: true,
        whatWeDid: true,
        organiserNotes: true,
        retentionLocked: true,
        walk: { select: { title: true, location: true } },
        createdBy: { select: { firstName: true, lastName: true, email: true } },
        involvedMembers: {
          select: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    }),
    // The walks Edit can link the report to: ones that have started (as the Reports list).
    admin.permReportsEdit
      ? prisma.walk.findMany({
          orderBy: { startsAt: "desc" },
          take: 200,
          select: { id: true, title: true, startsAt: true, durationMins: true, endedAt: true, cancelledAt: true },
        })
      : Promise.resolve([]),
  ]);
  if (!report) notFound();

  const linkable = walks.filter((walk) => {
    const status = walkStatus(walk);
    return status === "completed" || status === "in-progress";
  });

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <ReportPage
        canEdit={admin.permReportsEdit}
        canViewMembers={admin.permMembersView}
        createdBy={displayName(report.createdBy)}
        report={{
          id: report.id,
          reportNumber: report.reportNumber,
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
        }}
        walks={linkable.map((walk) => ({ id: walk.id, title: walk.title, startsAt: walk.startsAt.toISOString() }))}
      />
    </div>
  );
}

/** While it loads: the same page top, strip, details and bands, with grey shapes for what
 * depends on the report. */
function ReportPageFallback() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6 px-4 py-6 md:px-6" data-page-loading="">
      <AdminPageIntro description="" title="Accident report" />
      <div className="flex flex-col">
      <EdgeBar edgeTop>
        <div className="flex h-13 items-center px-4">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="ms-auto flex h-13 items-center gap-4 border-l px-4">
          <Skeleton className="h-4 w-28" />
        </div>
      </EdgeBar>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3" data-edge-stats="">
        {["When", "Walk", "Recorded by"].map((label) => (
          <div className={cn("flex flex-col gap-1", label === "Recorded by" && "col-span-2 md:col-span-1")} key={label}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <Skeleton className="h-5 w-full max-w-40" />
          </div>
        ))}
      </div>
      {["What happened", "Who was involved", "What we did"].map((title) => (
        <SettingsSection key={title} title={title}>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </SettingsSection>
      ))}
      </div>
    </div>
  );
}

export default function AccidentReportPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ReportPageFallback />}>
      <ReportPageContent {...props} />
    </Suspense>
  );
}
