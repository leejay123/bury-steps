import { requireAdmin } from "@/lib/auth";
import { ensureDefaultFaqCategories, loadHomepageFaqData } from "@/lib/homepage-faqs";
import { MAX_FAQ_CATEGORIES, MAX_HOMEPAGE_FAQS } from "@/lib/faqs";
import { getSiteTheme } from "@/lib/site-theme";
import { HomepageFaqManager } from "../../homepage/faq-manager";
import { SettingsPage } from "../settings-page";
import { FaqSectionCopySettings } from "./faq-section-copy-settings";

export const dynamic = "force-dynamic";

export default async function FaqsSettingsPage() {
  await requireAdmin();
  await ensureDefaultFaqCategories();
  const [{ faqs, categories }, theme] = await Promise.all([
    loadHomepageFaqData(),
    getSiteTheme(),
  ]);

  return (
    <SettingsPage
      description={`Up to ${MAX_HOMEPAGE_FAQS} questions on the public homepage, in up to ${MAX_FAQ_CATEGORIES} categories. Add, edit, reorder, or remove both.`}
      previewHref="/"
      title="FAQs"
    >
      <FaqSectionCopySettings
        faqSectionIntro={theme.faqSectionIntro}
        faqSectionTitle={theme.faqSectionTitle}
      />
      <HomepageFaqManager
        categories={categories}
        faqs={faqs}
        maxCategories={MAX_FAQ_CATEGORIES}
        maxFaqs={MAX_HOMEPAGE_FAQS}
      />
    </SettingsPage>
  );
}
