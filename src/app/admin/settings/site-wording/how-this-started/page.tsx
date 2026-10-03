import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsContentSkeleton, SettingsPage } from "../../settings-page";
import { HowThisStartedCopySettings } from "../how-this-started-copy-settings";



export default function HowThisStartedWordingPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="The heading, blurb, and full story for the homepage's How this started section."
      previewHref="/"
      title="How this started"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <HowThisStartedWordingPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function HowThisStartedWordingPageContent() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <>
      <HowThisStartedCopySettings
        howThisStartedBody={theme.howThisStartedBody}
        howThisStartedEyebrow={theme.howThisStartedEyebrow}
        howThisStartedTeaser={theme.howThisStartedTeaser}
        howThisStartedTitle={theme.howThisStartedTitle}
      />
    </>
  );
}
