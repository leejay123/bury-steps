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
import { SettingsPage, SettingsSection } from "../settings-page";
import { SettingsMask } from "../settings-mask";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { Skeleton } from "@/components/ui/skeleton";
import { SkText } from "@/components/list-skeletons";
import { newsletterListRows } from "@/lib/list-counts";
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
      <Suspense fallback={<SubscribersFallback />}>
        <PlaceholderPreview fallback={<SubscribersFallback />}>
          <AdminSubscribersSettingsPageContent />
        </PlaceholderPreview>
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

const STAT_LABELS = ["Newsletter (footer)", "Newsletter (members)", "Walk announcements on", "Notices on", "Progress on"];

/** A grey line one text line tall (h is the line height, the bar 64% of it). */
function GreyLine({ className, h = "h-5" }: { className: string; h?: string }) {
  return (
    <div className={`flex items-center ${h}`}>
      <Skeleton className={`h-[64%] max-w-full rounded-lg ${className}`} />
    </div>
  );
}

/**
 * Subscribers while it loads, laid out like the page: the number tiles
 * (real labels, grey numbers), the real newsletter form greyed, then the
 * list's heading and as many rows as it has — members' rows three lines,
 * footer signups two lines and a Remove button. Email addresses are
 * private, so only the counts are known ahead (newsletterListRows).
 */
async function SubscribersFallback() {
  const counts = (await newsletterListRows()) ?? { members: 0, footer: 0 };
  const widths = ["w-56", "w-44", "w-64", "w-48", "w-52", "w-40"];
  return (
    <div aria-hidden className="flex flex-col gap-8" data-page-loading="">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {STAT_LABELS.map((label) => (
          <div className="flex flex-col gap-1 rounded-lg border p-4" key={label}>
            <GreyLine className="w-10" h="h-8" />
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <SettingsMask>
        <SendNewsletterForm recipientCount={0} />
      </SettingsMask>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Newsletter list</h2>
          <p className="text-sm text-muted-foreground">
            <SkText text="00 people get the newsletter (0 have unsubscribed from the footer form over time). A subscriber who is also a member shows with their name. Members' other emails — notices, walk announcements and progress — are counted separately above, whatever they chose for the newsletter." />
          </p>
        </div>
        <Skeleton className="h-8 w-32 self-start rounded-md" />
        <ul className="flex flex-col overflow-hidden rounded-xl border bg-card">
          {Array.from({ length: counts.members }, (_, i) => (
            <li className="flex items-start gap-3 border-b p-3 last:border-0" key={`m${i}`}>
              <div className="flex min-w-0 flex-1 flex-col">
                <GreyLine className={widths[i % widths.length]} h="h-6" />
                <GreyLine className="w-32" />
                <GreyLine className="w-36" h="h-4" />
              </div>
            </li>
          ))}
          {Array.from({ length: counts.footer }, (_, i) => (
            <li className="flex items-start gap-3 border-b p-3 last:border-0" key={`f${i}`}>
              <div className="flex min-w-0 flex-1 flex-col">
                <GreyLine className={widths[(i + 3) % widths.length]} h="h-6" />
                <GreyLine className="w-44" h="h-4" />
              </div>
              <Skeleton className="h-7 w-20 rounded-md" />
            </li>
          ))}
          {counts.members + counts.footer === 0 ? (
            <li className="flex items-center gap-3 p-3">
              <p className="text-sm text-muted-foreground">No one&apos;s subscribed yet.</p>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
