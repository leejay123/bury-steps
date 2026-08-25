import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, displayName } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";

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
  await requireAdmin();
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

  const rows = [
    ["Name", "Email", "Clocked in (UK time)", "Medical acknowledgement", "Reported conditions"],
    ...walk.attendances.map((a) => [
      displayName(a.user),
      a.user.email,
      formatDateTime(a.clockedInAt),
      formatDateTime(a.medicalAckAt),
      a.conditions ?? "None reported",
    ]),
  ];

  const csv = rows.map((r) => r.map((c) => csvCell(c)).join(",")).join("\r\n");
  const filename = `bury-steps-${walk.startsAt.toISOString().slice(0, 10)}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
