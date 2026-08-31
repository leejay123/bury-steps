import { requireAdmin } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../settings-page";
import { CookieConsentSettings } from "./cookie-consent-settings";
import { DisplaySettings } from "./display-form";

export const dynamic = "force-dynamic";

export default async function DisplaySettingsPage() {
  await requireAdmin();
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="These options apply to the public site and organiser tools."
      title="Display"
    >
      <DisplaySettings scrollToTopEnabled={theme.scrollToTopEnabled} />
      <CookieConsentSettings variant={theme.cookieConsentVariant} />
    </SettingsPage>
  );
}
