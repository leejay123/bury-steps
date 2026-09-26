import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage, SettingsSectionGroup } from "../../settings-page";
import { BeforeYouSetOffToggle, HowWalksWorkToggle } from "../walk-page-card-toggles";
import { WalkPageCopySettings } from "../walk-page-copy-settings";

export const dynamic = "force-dynamic";

export default async function WalkPageCardsWordingPage() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="The two cards on a walk's own page. Edit the wording, or turn a card off if you don't want it shown."
      title="Walk page cards"
    >
      <SettingsSectionGroup
        description="Off hides that card on every walk. The wording below is kept, so turning it back on restores what you wrote."
        title="Show or hide"
      >
        <HowWalksWorkToggle enabled={theme.howWalksWorkEnabled} />
        <BeforeYouSetOffToggle enabled={theme.beforeYouSetOffEnabled} />
      </SettingsSectionGroup>
      <WalkPageCopySettings
        beforeYouSetOffTipsText={theme.beforeYouSetOffTipsText}
        howWalksWorkStepsText={theme.howWalksWorkStepsText}
      />
    </SettingsPage>
  );
}
