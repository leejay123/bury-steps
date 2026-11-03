import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission, displayName } from "@/lib/auth";
import { formatDateTime, utcToLondonWallClock } from "@/lib/dates";
import { slugifyWalkTitle } from "@/lib/walk-slug";

function csvCell(value: string | null): string {
  const v = value ?? "";
  // Guard against spreadsheet formula injection from free-text fields.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Every column follows what this organiser can already see on the walk
  // page: reported conditions only with Health notes (the owner), emergency
  // contacts with Attendance.
  const admin = await requirePermission("permWalksExport");
  const withHealth = admin.permWalksHealth;
  const withContacts = admin.permWalksAttendance;
  const { id } = await params;

  const walk = await prisma.walk.findUnique({
    where: { id },
    include: {
      attendances: {
        orderBy: { clockedInAt: "asc" },
        include: { user: { select: { firstName: true, lastName: true, email: true, emergencyContactName: true, emergencyContactPhone: true } } },
      },
    },
  });

  if (!walk) return new NextResponse("Not found", { status: 404 });

  const header = [
    "Name",
    "Email",
    "Clocked in (UK time)",
    "Clocked out (UK time)",
    "Clock-out reason",
    "Medical acknowledgement",
    ...(withHealth ? ["Reported conditions"] : []),
    ...(withContacts ? ["Emergency contact", "Emergency phone"] : []),
  ];
  const rows = [
    header,
    ...walk.attendances.map((a) => [
      displayName(a.user),
      a.user.email,
      formatDateTime(a.clockedInAt),
      a.clockedOutAt ? formatDateTime(a.clockedOutAt) : "",
      a.clockedOutReason ?? "",
      a.medicalAckAt ? formatDateTime(a.medicalAckAt) : "Not given (added by an organiser)",
      ...(withHealth ? [a.conditions ?? "None reported"] : []),
      ...(withContacts ? [a.user.emergencyContactName ?? "", a.user.emergencyContactPhone ?? ""] : []),
    ]),
  ];

  const csv = rows.map((r) => r.map((c) => csvCell(c)).join(",")).join("\r\n");
  // UK date plus the walk's name, so two walks on one day don't download
  // under the same name.
  const day = utcToLondonWallClock(walk.startsAt).slice(0, 10);
  const filename = `bury-steps-${day}-${slugifyWalkTitle(walk.title) || "walk"}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
