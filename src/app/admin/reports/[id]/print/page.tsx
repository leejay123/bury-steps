import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin, displayName } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/dates";
import { PrintReport } from "./print-report";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accident report",
};

export default async function PrintAccidentReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const report = await prisma.accidentReport.findUnique({
    where: { id },
    include: {
      walk: { select: { title: true, startsAt: true, location: true } },
      createdBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (!report) notFound();

  return (
    <PrintReport
      createdBy={displayName(report.createdBy)}
      happenedAt={formatDateTime(report.happenedAt)}
      organiserNotes={report.organiserNotes}
      walkLabel={
        report.walk
          ? `${report.walk.title}${report.walk.location ? ` · ${report.walk.location}` : ""}`
          : null
      }
      whatHappened={report.whatHappened}
      whatWeDid={report.whatWeDid}
      whoInvolved={report.whoInvolved}
    />
  );
}
