import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { prisma } from "@/lib/db";
import { requirePermission, displayName } from "@/lib/auth";
import { getSiteTheme, type SiteTheme } from "@/lib/site-theme";
import { SITE_SETTING_ID } from "@/lib/theme";
import { SettingsPage, SettingsSectionGroup } from "../settings-page";
import { SettingsMask } from "../settings-mask";
import { PlaceholderPreview } from "@/components/placeholder-preview";

import { AnnouncementSettings } from "./announcement-settings";
import { AnnouncementCopySettings } from "./announcement-copy-settings";
import { CookieConsentSettings } from "./cookie-consent-settings";
import { FooterWordmarkMobileSettings, FooterWordmarkSettings } from "./display-form";
import { ProgressToggle } from "./progress-toggle";
import { StoriesToggle } from "./stories-toggle";
import { OrganiserInviteToggle } from "./organiser-invite-toggle";
import { EmergencyContactToggle } from "./emergency-contact-toggle";
import { ContactMessagesOwnerSettings } from "./contact-messages-owner-settings";
import { PlaceholderPreviewToggle } from "./placeholder-preview-toggle";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function SiteBehaviourSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="Sitewide behaviour that isn't part of the homepage story — join bar, cookie notice, the footer name, Progress, clock-in, organiser invites, and the contact form."
      title="Site behaviour"
    >
      <Suspense fallback={<SettingsFallback />}>
        <PlaceholderPreview fallback={<SettingsFallback />}>
          <SiteBehaviourSettingsPageContent />
        </PlaceholderPreview>
      </Suspense>
    </SettingsPage>
  );
}

async function SiteBehaviourSettingsPageContent() {
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  const admin = await requirePermission("permDisplay");
  const [theme, organisers, settings] = await Promise.all([
    getSiteTheme(),
    prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: {
        contactMessagesOwnerId: true,
        emergencyContactRequired: true,
        organiserInviteRequired: true,
        progressEnabled: true,
        storiesEnabled: true,
      },
    }),
  ]);

  return <SettingsView admin={admin} organisers={organisers} settings={settings} theme={theme} />;
}

/** The page drawn from its saved values (also its placeholder, with stand-ins). */
function SettingsView({
  admin,
  organisers,
  settings,
  theme,
}: {
  admin: { isOwner: boolean };
  organisers: { id: string; firstName: string | null; lastName: string | null; email: string }[];
  settings: {
    contactMessagesOwnerId: string | null;
    emergencyContactRequired: boolean;
    organiserInviteRequired: boolean;
    progressEnabled: boolean;
    storiesEnabled: boolean;
  } | null;
  theme: SiteTheme;
}) {
  return (
    <>
      <SettingsSectionGroup description="The strip at the top of the homepage." title="Join bar">
        <AnnouncementSettings enabled={theme.announcementEnabled} />
        {theme.announcementEnabled ? (
          <AnnouncementCopySettings link={theme.announcementLink} text={theme.announcementText} />
        ) : null}
      </SettingsSectionGroup>

      <SettingsSectionGroup description="Behaviour that applies across the whole site." title="Across the site">
        <CookieConsentSettings variant={theme.cookieConsentVariant} />
        <FooterWordmarkSettings enabled={theme.footerWordmarkEnabled} />
        {theme.footerWordmarkEnabled ? <FooterWordmarkMobileSettings enabled={theme.footerWordmarkMobile} /> : null}
        <ProgressToggle enabled={settings?.progressEnabled ?? true} />
        <StoriesToggle enabled={settings?.storiesEnabled ?? true} />
        {admin.isOwner ? <PlaceholderPreviewToggle /> : null}
      </SettingsSectionGroup>

      <SettingsSectionGroup description="What members fill in before they clock in." title="Clock-in">
        <EmergencyContactToggle enabled={settings?.emergencyContactRequired ?? false} />
      </SettingsSectionGroup>

      <SettingsSectionGroup description="How promoting a member to organiser takes effect." title="Organisers">
        <OrganiserInviteToggle enabled={settings?.organiserInviteRequired ?? false} />
      </SettingsSectionGroup>

      <SettingsSectionGroup
        description="Who's responsible for the public contact form."
        id="contact-messages"
        title="Contact messages"
      >
        <ContactMessagesOwnerSettings
          currentOwnerId={settings?.contactMessagesOwnerId ?? null}
          organisers={organisers.map((organiser) => ({ id: organiser.id, name: displayName(organiser) }))}
        />
      </SettingsSectionGroup>
    </>
  );
}

/** While it loads: the page drawn with the site's default values, greyed (SettingsMask). */
/** While it loads: the page drawn with the site's saved look (a shared saved copy, so the same
 * settings show and hide as on the page, e.g. the footer name's phone switch), greyed. */
async function SettingsFallback() {
  const theme = await getSiteTheme();
  return (
    <SettingsMask>
      <SettingsView admin={{ isOwner: true }} organisers={[]} settings={null} theme={theme} />
    </SettingsMask>
  );
}
