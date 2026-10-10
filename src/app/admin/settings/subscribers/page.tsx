import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { Download } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { DataList, DataListActions, DataListBody, DataListItem } from "@/components/data-list";
import { SettingsContentSkeleton, SettingsPage, SettingsSection } from "../settings-page";
import { RemoveSubscriberButton } from "./remove-subscriber-button";
import { SendNewsletterForm } from "./send-newsletter-form";



function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-4">
      <p className="text-2xl font-semibold tracking-tight">{value.toLocaleString("en-GB")}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function AdminSubscribersSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="Who's opted into which emails. Send a newsletter to everyone on the list straight from this page, or download the list."
      title="Subscribers"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <AdminSubscribersSettingsPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function AdminSubscribersSettingsPageContent() {
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  await requirePermission("permSubscribers");

  const [
    activeFooterSubscribers,
    activeFooterCount,
    unsubscribedFooterCount,
    newsletterMembers,
    newsletterMemberCount,
    walkAnnouncementCount,
    noticesCount,
    progressCount,
    footerEmailsForDedupe,
    memberEmailsForDedupe,
  ] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where: { unsubscribedAt: null },
      select: { id: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: { not: null } } }),
    prisma.user.findMany({
      where: { emailNewsletter: true },
      select: { email: true, firstName: true, lastName: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.count({ where: { emailNewsletter: true } }),
    prisma.user.count({ where: { emailWalkAnnouncements: true } }),
    prisma.user.count({ where: { emailNotices: true } }),
    prisma.user.count({ where: { emailProgress: true } }),
    // Uncapped email-only scans for the campaign recipient total (same
    // dedupe as sendNewsletterCampaign — people on both lists count once).
    prisma.newsletterSubscriber.findMany({
      where: { unsubscribedAt: null },
      select: { email: true },
    }),
    prisma.user.findMany({
      where: { emailNewsletter: true },
      select: { email: true },
    }),
  ]);

  const recipientEmails = new Set<string>();
  for (const row of footerEmailsForDedupe) recipientEmails.add(row.email.toLowerCase());
  for (const row of memberEmailsForDedupe) recipientEmails.add(row.email.toLowerCase());
  const newsletterRecipientCount = recipientEmails.size;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Newsletter (footer)" value={activeFooterCount} />
        <StatTile label="Newsletter (members)" value={newsletterMemberCount} />
        <StatTile label="Walk announcements on" value={walkAnnouncementCount} />
        <StatTile label="Notices on" value={noticesCount} />
        <StatTile label="Progress on" value={progressCount} />
      </div>

      <SendNewsletterForm recipientCount={newsletterRecipientCount} />

      <SettingsSection
        description={`${newsletterRecipientCount} ${newsletterRecipientCount === 1 ? "person gets" : "people get"} the newsletter (${unsubscribedFooterCount} ${unsubscribedFooterCount === 1 ? "has" : "have"} unsubscribed from the footer form over time). A subscriber who is also a member shows with their name. Members' other emails — notices, walk announcements and progress — are counted separately above, whatever they chose for the newsletter.`}
        flush
        title="Newsletter list"
      >
        {/* A plain download link: next/link would fetch (and so run) the
            export ahead of time on every visit to this page. */}
        <Button asChild className="self-start" size="sm" variant="outline">
          <a download href="/admin/settings/subscribers/export">
            <Download aria-hidden className="size-4" />
            Export as CSV
          </a>
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
    </>
  );
}
