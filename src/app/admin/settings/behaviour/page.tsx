import { prisma } from "@/lib/db";
import { requirePermission, displayName } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SITE_SETTING_ID } from "@/lib/theme";
import { SettingsPage, SettingsSectionGroup } from "../settings-page";
import { CookieConsentSettings } from "./cookie-consent-settings";
import { DisplaySettings } from "./display-form";
import { ProgressToggle } from "./progress-toggle";
import { OrganiserInviteToggle } from "./organiser-invite-toggle";
import { ContactMessagesOwnerSettings } from "./contact-messages-owner-settings";

export const dynamic = "force-dynamic";

export default async function SiteBehaviourSettingsPage() {
  await requirePermission("permDisplay");
  const [theme, organisers, settings] = await Promise.all([
    getSiteTheme(),
    prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { contactMessagesOwnerId: true, organiserInviteRequired: true, progressEnabled: true },
    }),
  ]);

  return (
    <SettingsPage
      description="Sitewide behaviour that isn't part of the homepage story — cookie notice, back to top, Progress, organiser invites, and the contact form."
      title="Site behaviour"
    >
      <SettingsSectionGroup description="Behaviour that applies across the whole site." title="Site chrome">
        <CookieConsentSettings variant={theme.cookieConsentVariant} />
        <DisplaySettings scrollToTopEnabled={theme.scrollToTopEnabled} />
        <ProgressToggle enabled={settings?.progressEnabled ?? true} />
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
    </SettingsPage>
  );
}
