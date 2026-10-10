import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsContentSkeleton, SettingsPage, SettingsSectionGroup } from "../../settings-page";
import { BeforeYouSetOffToggle, HowWalksWorkToggle } from "../walk-page-card-toggles";
import { WalkPageCopySettings } from "../walk-page-copy-settings";
import { WalkPageSectionsSettings } from "../walk-page-sections-settings";



export default function WalkPageCardsWordingPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="The cards on a walk's own page, and the order of its sections. Edit the wording, turn a card off, or move a section up or down."
      title="Walk page cards"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <WalkPageCardsWordingPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function WalkPageCardsWordingPageContent() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <>
      <SettingsSectionGroup
        description="Off hides that card on every walk. The wording below is kept, so turning it back on restores what you wrote."
        title="Show or hide"
      >
        <HowWalksWorkToggle enabled={theme.howWalksWorkEnabled} />
        <BeforeYouSetOffToggle enabled={theme.beforeYouSetOffEnabled} />
      </SettingsSectionGroup>
      <WalkPageSectionsSettings
        beforeYouSetOffEnabled={theme.beforeYouSetOffEnabled}
        sections={theme.walkPageSections}
      />
      <WalkPageCopySettings
        beforeYouSetOffTipsText={theme.beforeYouSetOffTipsText}
        howWalksWorkStepsText={theme.howWalksWorkStepsText}
      />
    </>
  );
}
