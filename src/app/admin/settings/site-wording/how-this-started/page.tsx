import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../../settings-page";
import { HowThisStartedCopySettings } from "../how-this-started-copy-settings";

export const dynamic = "force-dynamic";

export default async function HowThisStartedWordingPage() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="The heading, blurb, and full story for the homepage's How this started section."
      previewHref="/"
      title="How this started"
    >
      <HowThisStartedCopySettings
        howThisStartedBody={theme.howThisStartedBody}
        howThisStartedEyebrow={theme.howThisStartedEyebrow}
        howThisStartedTeaser={theme.howThisStartedTeaser}
        howThisStartedTitle={theme.howThisStartedTitle}
      />
    </SettingsPage>
  );
}
