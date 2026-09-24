import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission, displayName } from "@/lib/auth";
import { formatDateTime, londonDateKey } from "@/lib/dates";

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
  // Export alone is enough for the roster CSV. Health notes / medical ack
  // columns are only included when the viewer also has permWalksHealth —
  // organisers get names, emails, and times without a back door into notes.
  const admin = await requirePermission("permWalksExport");
  const includeHealth = admin.permWalksHealth;
  const { id } = await params;

  const walk = await prisma.walk.findUnique({
    where: { id },
    include: {
      attendances: {
        orderBy: { clockedInAt: "asc" },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
  });

  if (!walk) return new NextResponse("Not found", { status: 404 });

  const header = includeHealth
    ? [
        "Name",
        "Email",
        "Clocked in (UK time)",
        "Clocked out (UK time)",
        "Clock-out reason",
        "Medical acknowledgement",
        "Reported conditions",
      ]
    : ["Name", "Email", "Clocked in (UK time)", "Clocked out (UK time)", "Clock-out reason"];

  const rows = [
    header,
    ...walk.attendances.map((a) => {
      const base = [
        displayName(a.user),
        a.user.email,
        formatDateTime(a.clockedInAt),
        a.clockedOutAt ? formatDateTime(a.clockedOutAt) : "",
        a.clockedOutReason ?? "",
      ];
      if (!includeHealth) return base;
      return [...base, formatDateTime(a.medicalAckAt), a.conditions ?? "None reported"];
    }),
  ];

  const csv = rows.map((r) => r.map((c) => csvCell(c)).join(",")).join("\r\n");
  const filename = `bury-steps-${londonDateKey(walk.startsAt)}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
