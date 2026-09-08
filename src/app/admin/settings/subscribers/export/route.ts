import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";

function csvCell(value: string | null): string {
  const v = value ?? "";
  // Guard against spreadsheet formula injection from free-text fields.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Everyone currently opted into the newsletter — footer signups
 * (NewsletterSubscriber, not unsubscribed) and members who opted in from
 * their own account (User.emailNewsletter). Deduped by email, since the
 * same address can appear in both. Columns match what Resend's Audience
 * CSV import expects (email / first name / last name), with two extra
 * columns for context that Resend just ignores.
 */
export async function GET() {
  await requireAdmin();

  const [footerSubscribers, memberSubscribers] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where: { unsubscribedAt: null },
      select: { email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { emailNewsletter: true },
      select: { email: true, firstName: true, lastName: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const byEmail = new Map<
    string,
    { email: string; firstName: string; lastName: string; source: string; since: Date }
  >();
  for (const row of footerSubscribers) {
    byEmail.set(row.email.toLowerCase(), {
      email: row.email,
      firstName: "",
      lastName: "",
      source: "Newsletter signup",
      since: row.createdAt,
    });
  }
  for (const row of memberSubscribers) {
    // A member's own opt-in wins over an earlier anonymous footer signup
    // for the same address — it carries a name.
    byEmail.set(row.email.toLowerCase(), {
      email: row.email,
      firstName: row.firstName ?? "",
      lastName: row.lastName ?? "",
      source: "Member",
      since: row.createdAt,
    });
  }

  const rows = [
    ["Email", "First name", "Last name", "Source", "Subscribed since (UK time)"],
    ...[...byEmail.values()].map((row) => [
      row.email,
      row.firstName,
      row.lastName,
      row.source,
      formatDateTime(row.since),
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => csvCell(cell)).join(",")).join("\r\n");
  const filename = `bury-steps-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
