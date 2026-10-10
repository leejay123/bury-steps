import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { prisma } from "@/lib/db";
import { requirePermission, displayName } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SITE_SETTING_ID } from "@/lib/theme";
import { SettingsContentSkeleton, SettingsPage, SettingsSectionGroup } from "../settings-page";
import { AnnouncementSettings } from "./announcement-settings";
import { CookieConsentSettings } from "./cookie-consent-settings";
import { PageTransitionSettings } from "./page-transition-settings";
import { MobileNavSettings } from "./mobile-nav-settings";
import { DisplaySettings, FooterWordmarkMobileSettings, FooterWordmarkSettings } from "./display-form";
import { ProgressToggle } from "./progress-toggle";
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
      description="Sitewide behaviour that isn't part of the homepage story — announcement bar, page transitions, the phone menu, cookie notice, back to top, the footer name, Progress, clock-in, organiser invites, and the contact form."
      title="Site behaviour"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <SiteBehaviourSettingsPageContent />
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
      },
    }),
  ]);

  return (
    <>
      <SettingsSectionGroup description="A message across the top of every page." title="Announcement">
        <AnnouncementSettings
          enabled={theme.announcementEnabled}
          link={theme.announcementLink}
          pages={theme.announcementPages}
          text={theme.announcementText}
        />
      </SettingsSectionGroup>

      <SettingsSectionGroup description="Behaviour that applies across the whole site." title="Across the site">
        <CookieConsentSettings variant={theme.cookieConsentVariant} />
        <PageTransitionSettings mode={theme.pageTransition} />
        <MobileNavSettings style={theme.mobileNav} />
        <DisplaySettings scrollToTopEnabled={theme.scrollToTopEnabled} />
        <FooterWordmarkSettings enabled={theme.footerWordmarkEnabled} />
        {theme.footerWordmarkEnabled ? <FooterWordmarkMobileSettings enabled={theme.footerWordmarkMobile} /> : null}
        <ProgressToggle enabled={settings?.progressEnabled ?? true} />
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
