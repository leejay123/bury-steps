import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { getOptionalAdmin, requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { FaqSectionCopySettings } from "../site-wording/faq-section-copy-settings";
import { ensureDefaultFaqCategories, getHomepageFaqData, loadHomepageFaqData } from "@/lib/homepage-faqs";
import { MAX_FAQ_CATEGORIES, MAX_HOMEPAGE_FAQS } from "@/lib/faqs";
import { HomepageFaqManager } from "../../homepage/faq-manager";
import { SettingsPage } from "../settings-page";
import { PlaceholderPreview } from "@/components/placeholder-preview";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function FaqsSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description={`Up to ${MAX_HOMEPAGE_FAQS} questions on the public homepage, in up to ${MAX_FAQ_CATEGORIES} categories, and the heading above them.`}
      previewHref="/"
      title="FAQs"
    >
      <Suspense fallback={<SettingsFallback />}>
        <PlaceholderPreview fallback={<SettingsFallback />}>
          <FaqsSettingsPageContent />
        </PlaceholderPreview>
      </Suspense>
    </SettingsPage>
  );
}

async function FaqsSettingsPageContent() {
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  await requirePermission("permHomepage");
  // The homepage heading above them is site wording (permDisplay): shown to those who may change it.
  const [admin, theme] = await Promise.all([getOptionalAdmin(), getSiteTheme()]);
  await ensureDefaultFaqCategories();
  const { faqs, categories } = await loadHomepageFaqData();

  return (
    <>
      {admin?.permDisplay ? (
        <FaqSectionCopySettings
          faqSectionIntro={theme.faqSectionIntro}
          faqSectionTitle={theme.faqSectionTitle}
        />
      ) : null}
      <HomepageFaqManager
        categories={categories}
        faqs={faqs}
        maxCategories={MAX_FAQ_CATEGORIES}
        maxFaqs={MAX_HOMEPAGE_FAQS}
      />
    </>
  );
}

/**
 * While the page checks who you are: the real list, from the same shared
 * saved copy the homepage uses (these are public anyway), so a refresh
 * shows them at once instead of an empty space.
 */
async function SettingsFallback() {
  const [{ faqs, categories }, theme] = await Promise.all([getHomepageFaqData(), getSiteTheme()]);
  return (
    <>
      <FaqSectionCopySettings faqSectionIntro={theme.faqSectionIntro} faqSectionTitle={theme.faqSectionTitle} />
      <HomepageFaqManager
        categories={categories}
        faqs={faqs}
        maxCategories={MAX_FAQ_CATEGORIES}
        maxFaqs={MAX_HOMEPAGE_FAQS}
      />
    </>
  );
}
