import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsContentSkeleton, SettingsPage } from "../../settings-page";
import { AboutListsSettings } from "../about-lists-settings";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

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
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
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
