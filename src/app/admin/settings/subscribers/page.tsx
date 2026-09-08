import Link from "next/link";
import { Download } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { SettingsPage, SettingsSection } from "../settings-page";

export const dynamic = "force-dynamic";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-4">
      <p className="text-2xl font-semibold tracking-tight">{value.toLocaleString("en-GB")}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function AdminSubscribersSettingsPage() {
  await requireAdmin();

  const [
    activeFooterSubscribers,
    unsubscribedFooterCount,
    newsletterMembers,
    walkAnnouncementCount,
    noticesCount,
    progressCount,
  ] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where: { unsubscribedAt: null },
      select: { email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: { not: null } } }),
    prisma.user.findMany({
      where: { emailNewsletter: true },
      select: { email: true, firstName: true, lastName: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.count({ where: { emailWalkAnnouncements: true } }),
    prisma.user.count({ where: { emailNotices: true } }),
    prisma.user.count({ where: { emailProgress: true } }),
  ]);

  return (
    <SettingsPage
      description="Who's opted into which emails. Export the newsletter list below to run an actual campaign through Resend's own Audiences/Broadcasts — this site only sends the one-off subscribe confirmation, not campaigns."
      title="Subscribers"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Newsletter (footer)" value={activeFooterSubscribers.length} />
        <StatTile label="Newsletter (members)" value={newsletterMembers.length} />
        <StatTile label="Walk announcements on" value={walkAnnouncementCount} />
        <StatTile label="Notices on" value={noticesCount} />
        <StatTile label="Progress on" value={progressCount} />
      </div>

      <SettingsSection
        description={`${activeFooterSubscribers.length + newsletterMembers.length} people currently opted in (${unsubscribedFooterCount} have unsubscribed via the footer form over time). Includes a name where the subscriber is also a member — everyone's own account emails also stays counted under "Notices"/"Walk announcements"/"Progress" above regardless of their newsletter choice.`}
        title="Newsletter list"
      >
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/settings/subscribers/export">
            <Download aria-hidden className="size-4" />
            Export as CSV (for Resend)
          </Link>
        </Button>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Source</th>
                <th className="p-3 font-medium">Since</th>
              </tr>
            </thead>
            <tbody>
              {newsletterMembers.map((member) => (
                <tr className="border-b last:border-b-0" key={`member-${member.email}`}>
                  <td className="p-3">{member.email}</td>
                  <td className="p-3">{displayName(member)}</td>
                  <td className="p-3 text-muted-foreground">Member</td>
                  <td className="p-3 text-muted-foreground">{formatDate(member.createdAt)}</td>
                </tr>
              ))}
              {activeFooterSubscribers.map((subscriber) => (
                <tr className="border-b last:border-b-0" key={`footer-${subscriber.email}`}>
                  <td className="p-3">{subscriber.email}</td>
                  <td className="p-3 text-muted-foreground">—</td>
                  <td className="p-3 text-muted-foreground">Newsletter signup</td>
                  <td className="p-3 text-muted-foreground">{formatDate(subscriber.createdAt)}</td>
                </tr>
              ))}
              {newsletterMembers.length === 0 && activeFooterSubscribers.length === 0 ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={4}>
                    No one&apos;s subscribed yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
