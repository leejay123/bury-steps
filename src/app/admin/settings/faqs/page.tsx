import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { ensureDefaultFaqCategories, loadHomepageFaqData } from "@/lib/homepage-faqs";
import { MAX_FAQ_CATEGORIES, MAX_HOMEPAGE_FAQS } from "@/lib/faqs";
import { HomepageFaqManager } from "../../homepage/faq-manager";
import { SettingsContentSkeleton, SettingsPage } from "../settings-page";



export default function FaqsSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description={`Up to ${MAX_HOMEPAGE_FAQS} questions on the public homepage, in up to ${MAX_FAQ_CATEGORIES} categories. Change the heading above them under Site wording → FAQ heading.`}
      previewHref="/"
      title="FAQs"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <FaqsSettingsPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function FaqsSettingsPageContent() {
  await requirePermission("permHomepage");
  await ensureDefaultFaqCategories();
  const { faqs, categories } = await loadHomepageFaqData();

  return (
    <>
      <HomepageFaqManager
        categories={categories}
        faqs={faqs}
        maxCategories={MAX_FAQ_CATEGORIES}
        maxFaqs={MAX_HOMEPAGE_FAQS}
      />
    </>
  );
}
