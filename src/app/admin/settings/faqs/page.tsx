import { requirePermission } from "@/lib/auth";
import { ensureDefaultFaqCategories, loadHomepageFaqData } from "@/lib/homepage-faqs";
import { MAX_FAQ_CATEGORIES, MAX_HOMEPAGE_FAQS } from "@/lib/faqs";
import { HomepageFaqManager } from "../../homepage/faq-manager";
import { SettingsPage } from "../settings-page";

export const dynamic = "force-dynamic";

export default async function FaqsSettingsPage() {
  await requirePermission("permHomepage");
  await ensureDefaultFaqCategories();
  const { faqs, categories } = await loadHomepageFaqData();

  return (
    <SettingsPage
      description={`Up to ${MAX_HOMEPAGE_FAQS} questions on the public homepage, in up to ${MAX_FAQ_CATEGORIES} categories. Change the heading above them under Site wording → FAQ heading.`}
      previewHref="/"
      title="FAQs"
    >
      <HomepageFaqManager
        categories={categories}
        faqs={faqs}
        maxCategories={MAX_FAQ_CATEGORIES}
        maxFaqs={MAX_HOMEPAGE_FAQS}
      />
    </SettingsPage>
  );
}
