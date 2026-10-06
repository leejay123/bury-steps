import { Suspense } from "react";
import { AdminPageFallback } from "@/app/admin/admin-page-fallback";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { displayName, getOptionalUser, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatLongDateTime } from "@/lib/dates";
import { involvedSummaryText } from "@/lib/accident-reports";
import { getSiteTheme } from "@/lib/site-theme";
import { PrintReport } from "./print-report";



// The tab says "Accident report" only to an organiser looking at a real
// report. Anyone else, or a link to one that has gone, gets the plain site
// name like any other missing page.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const user = await getOptionalUser();
  if (user?.role !== "ADMIN") return {};
  const { id } = await params;
  const exists = await prisma.accidentReport.count({ where: { id } });
  return exists ? { title: "Accident report" } : {};
}

async function PrintAccidentReportPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("permReportsView");
  const { id } = await params;

  const report = await prisma.accidentReport.findUnique({
    where: { id },
    include: {
      walk: { select: { title: true, startsAt: true, location: true } },
      createdBy: { select: { firstName: true, lastName: true, email: true } },
      involvedMembers: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  if (!report) notFound();

  const theme = await getSiteTheme();

  return (
    <PrintReport
      createdBy={displayName(report.createdBy)}
      happenedAt={formatLongDateTime(report.happenedAt)}
      logoSrc={theme.logoSrc}
      reportBannerSrc={theme.reportBannerSrc}
      organiserNotes={report.organiserNotes}
      walkLabel={
        report.walk
          ? `${report.walk.title}${report.walk.location ? ` · ${report.walk.location}` : ""}`
          : null
      }
      whatHappened={report.whatHappened}
      whatWeDid={report.whatWeDid}
      whoInvolved={involvedSummaryText(report.whoInvolved, report.involvedMembers)}
    />
  );
}

/** Everything here depends on who's asking and on live data, so the page
 * shows a matching placeholder for an instant while it loads. */
export default function PrintAccidentReportPage(props: Parameters<typeof PrintAccidentReportPageContent>[0]) {
  return (
    <Suspense fallback={<AdminPageFallback rows={4} />}>
      <PrintAccidentReportPageContent {...props} />
    </Suspense>
  );
}
