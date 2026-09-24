import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../../settings-page";
import { WalkPageCopySettings } from "../walk-page-copy-settings";

export const dynamic = "force-dynamic";

export default async function WalkPageCardsWordingPage() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="The two cards shown on a walk's own page — before someone clocks in, and while waiting for clock-in to open. Not shown on the homepage."
      title="Walk page cards"
    >
      <WalkPageCopySettings
        beforeYouSetOffTipsText={theme.beforeYouSetOffTipsText}
        howWalksWorkStepsText={theme.howWalksWorkStepsText}
      />
    </SettingsPage>
  );
}
