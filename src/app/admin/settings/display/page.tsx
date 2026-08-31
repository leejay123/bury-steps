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
      description="Back to top, and how the cookie notice looks for first-time visitors."
      title="Display"
    >
      <CookieConsentSettings variant={theme.cookieConsentVariant} />
      <DisplaySettings scrollToTopEnabled={theme.scrollToTopEnabled} />
    </SettingsPage>
  );
}
