import Link from "next/link";
import { Download } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { DataList, DataListActions, DataListBody, DataListItem } from "@/components/data-list";
import { SettingsPage, SettingsSection } from "../settings-page";
import { RemoveSubscriberButton } from "./remove-subscriber-button";
import { SendNewsletterForm } from "./send-newsletter-form";

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
      select: { id: true, email: true, createdAt: true },
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

  const newsletterRecipientCount = activeFooterSubscribers.length + newsletterMembers.length;

  return (
    <SettingsPage
      description="Who's opted into which emails. Every newsletter subscriber below is kept in sync with a Resend audience automatically — send a real campaign to all of them without leaving this page."
      title="Subscribers"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Newsletter (footer)" value={activeFooterSubscribers.length} />
        <StatTile label="Newsletter (members)" value={newsletterMembers.length} />
        <StatTile label="Walk announcements on" value={walkAnnouncementCount} />
        <StatTile label="Notices on" value={noticesCount} />
        <StatTile label="Progress on" value={progressCount} />
      </div>

      <SendNewsletterForm recipientCount={newsletterRecipientCount} />

      <SettingsSection
        description={`${newsletterRecipientCount} people currently opted in (${unsubscribedFooterCount} have unsubscribed via the footer form over time). Includes a name where the subscriber is also a member — everyone's own account emails also stays counted under "Notices"/"Walk announcements"/"Progress" above regardless of their newsletter choice.`}
        title="Newsletter list"
      >
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/settings/subscribers/export">
            <Download aria-hidden className="size-4" />
            Export as CSV
          </Link>
        </Button>

        <DataList>
          {newsletterMembers.map((member) => (
            <DataListItem
              className="cursor-default items-start hover:bg-transparent"
              key={`member-${member.email}`}
            >
              <DataListBody>
                <p className="font-medium wrap-break-word">{member.email}</p>
                <p className="text-sm text-muted-foreground wrap-break-word">
                  {displayName(member)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Member · {formatDate(member.createdAt)}
                </p>
              </DataListBody>
            </DataListItem>
          ))}
          {activeFooterSubscribers.map((subscriber) => (
            <DataListItem className="items-start hover:bg-transparent" key={subscriber.id}>
              <DataListBody>
                <p className="font-medium wrap-break-word">{subscriber.email}</p>
                <p className="text-xs text-muted-foreground">
                  Newsletter signup · {formatDate(subscriber.createdAt)}
                </p>
              </DataListBody>
              <DataListActions>
                <RemoveSubscriberButton email={subscriber.email} id={subscriber.id} />
              </DataListActions>
            </DataListItem>
          ))}
          {newsletterMembers.length === 0 && activeFooterSubscribers.length === 0 ? (
            <DataListItem className="cursor-default hover:bg-transparent">
              <DataListBody>
                <p className="text-sm text-muted-foreground">No one&apos;s subscribed yet.</p>
              </DataListBody>
            </DataListItem>
          ) : null}
        </DataList>
      </SettingsSection>
    </SettingsPage>
  );
}
