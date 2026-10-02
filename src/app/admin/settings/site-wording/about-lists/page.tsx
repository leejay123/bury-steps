import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../../settings-page";
import { AboutListsSettings } from "../about-lists-settings";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


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
