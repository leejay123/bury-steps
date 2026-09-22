import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../../settings-page";
import { AboutListsSettings } from "../about-lists-settings";

export const dynamic = "force-dynamic";

export default async function AboutListsWordingPage() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="The goals, places, expect, and rules lists shown in the homepage's About drawer."
      previewHref="/"
      title="About lists"
    >
      <AboutListsSettings
        aboutExpectHeading={theme.aboutExpectHeading}
        aboutExpectText={theme.aboutExpectText}
        aboutGoalsHeading={theme.aboutGoalsHeading}
        aboutGoalsText={theme.aboutGoalsText}
        aboutPlacesHeading={theme.aboutPlacesHeading}
        aboutPlacesText={theme.aboutPlacesText}
        aboutRulesHeading={theme.aboutRulesHeading}
        aboutRulesText={theme.aboutRulesText}
      />
    </SettingsPage>
  );
}
