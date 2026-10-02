import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsContentSkeleton, SettingsPage } from "../../settings-page";
import { FaqSectionCopySettings } from "../faq-section-copy-settings";



export default function FaqWordingPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="The heading and short intro above the question list on the homepage. The questions themselves are managed under FAQs."
      previewHref="/"
      title="FAQ heading"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <FaqWordingPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function FaqWordingPageContent() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <>
      <FaqSectionCopySettings
        faqSectionIntro={theme.faqSectionIntro}
        faqSectionTitle={theme.faqSectionTitle}
      />
    </>
  );
}
