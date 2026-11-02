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
import { newsletterListRows } from "@/lib/list-counts";
import { RemoveSubscriberButton } from "./remove-subscriber-button";
import { SendNewsletterForm } from "./send-newsletter-form";



function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-4">
      <p className="text-2xl font-semibold tracking-tight">
        <span data-sk-value="">{value.toLocaleString("en-GB")}</span>
      </p>
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
      description="Who's opted into which emails. Send a newsletter to the list from here, or download it."
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
    <SubscribersView
      counts={{
        footer: activeFooterCount,
        members: newsletterMemberCount,
        notices: noticesCount,
        progress: progressCount,
        walks: walkAnnouncementCount,
      }}
      footer={activeFooterSubscribers}
      members={newsletterMembers}
      recipients={newsletterRecipientCount}
      unsubscribed={unsubscribedFooterCount}
    />
  );
}

type SubscribersViewProps = {
  counts: { footer: number; members: number; walks: number; notices: number; progress: number };
  recipients: number;
  unsubscribed: number;
  members: { email: string; firstName: string | null; lastName: string | null; createdAt: Date }[];
  footer: { id: string; email: string; createdAt: Date }[];
};

/**
 * The page itself, drawn from its figures and lists — and its placeholder too, from stand-in
 * rows (SubscribersFallback), so the two can never drift apart. The figures, addresses, names
 * and dates are marked as values: in the placeholder (SettingsMask) they show as grey bars.
 */
function SubscribersView({ counts, recipients, unsubscribed, members, footer }: SubscribersViewProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5" data-edge-stats="">
        <StatTile label="Newsletter (footer)" value={counts.footer} />
        <StatTile label="Newsletter (members)" value={counts.members} />
        <StatTile label="Walk announcements on" value={counts.walks} />
        <StatTile label="Notices on" value={counts.notices} />
        <StatTile label="Progress on" value={counts.progress} />
      </div>

      <SendNewsletterForm recipientCount={recipients} />

      <SettingsSection
        description={
          <>
            <span data-sk-value="">
              {recipients} {recipients === 1 ? "person gets" : "people get"}
            </span>{" "}
            the newsletter (
            <span data-sk-value="">
              {unsubscribed} {unsubscribed === 1 ? "has" : "have"}
            </span>{" "}
            unsubscribed from the footer form over time). A subscriber who is also a member shows with their name.
            Members&apos; other emails — notices, walk announcements and progress — are counted separately above,
            whatever they chose for the newsletter.
          </>
        }
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
          {members.map((member) => (
            <DataListItem
              className="cursor-default items-start hover:bg-transparent"
              key={`member-${member.email}`}
            >
              <DataListBody>
                <p className="font-medium wrap-break-word">
                  <span data-sk-value="">{member.email}</span>
                </p>
                <p className="text-sm text-muted-foreground wrap-break-word">
                  <span data-sk-value="">{displayName(member)}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Member · <span data-sk-value="">{formatDate(member.createdAt)}</span>
                </p>
              </DataListBody>
            </DataListItem>
          ))}
          {footer.map((subscriber) => (
            <DataListItem className="items-start hover:bg-transparent" key={subscriber.id}>
              <DataListBody>
                <p className="font-medium wrap-break-word">
                  <span data-sk-value="">{subscriber.email}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Newsletter signup · <span data-sk-value="">{formatDate(subscriber.createdAt)}</span>
                </p>
              </DataListBody>
              <DataListActions>
                <RemoveSubscriberButton email={subscriber.email} id={subscriber.id} />
              </DataListActions>
            </DataListItem>
          ))}
          {members.length === 0 && footer.length === 0 ? (
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

/** A fixed stand-in date for the placeholder's rows (greyed; never the time now). */
const STAND_IN_DATE = new Date(Date.UTC(2026, 8, 28));

/**
 * Subscribers while it loads: the page itself (SubscribersView) with stand-in rows, as many
 * members and footer signups as the list has (newsletterListRows; the addresses are private),
 * greyed by SettingsMask — the same tiles, bands, lines and row heights as the page.
 */
async function SubscribersFallback() {
  const counts = (await newsletterListRows()) ?? { members: 0, footer: 0 };
  return (
    <SettingsMask>
      <SubscribersView
        counts={{ footer: 0, members: 0, notices: 0, progress: 0, walks: 0 }}
        footer={Array.from({ length: counts.footer }, (_, i) => ({
          id: `stand-in-${i}`,
          email: "someone.example@gmail.com",
          createdAt: STAND_IN_DATE,
        }))}
        members={Array.from({ length: counts.members }, () => ({
          email: "someone.example@gmail.com",
          firstName: "Firstname",
          lastName: "Lastname",
          createdAt: STAND_IN_DATE,
        }))}
        recipients={10}
        unsubscribed={0}
      />
    </SettingsMask>
  );
}
