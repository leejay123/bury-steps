import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsContentSkeleton, SettingsPage } from "../../settings-page";
import { AboutListsSettings } from "../about-lists-settings";



export default function AboutListsWordingPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="The goals, places, expect, and rules lists shown in the homepage's About drawer."
      previewHref="/"
      title="About lists"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <AboutListsWordingPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function AboutListsWordingPageContent() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <>
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
    </>
  );
}
