import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../../settings-page";
import { FaqSectionCopySettings } from "../faq-section-copy-settings";

export const dynamic = "force-dynamic";

export default async function FaqWordingPage() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="The heading and short intro above the question list on the homepage. The questions themselves are managed under FAQs."
      previewHref="/"
      title="FAQ heading"
    >
      <FaqSectionCopySettings
        faqSectionIntro={theme.faqSectionIntro}
        faqSectionTitle={theme.faqSectionTitle}
      />
    </SettingsPage>
  );
}
