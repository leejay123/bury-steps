import { requireAdmin } from "@/lib/auth";
import { getHomepageFaqs } from "@/lib/homepage-faqs";
import { MAX_HOMEPAGE_FAQS } from "@/lib/faqs";
import { HomepageFaqManager } from "../../homepage/faq-manager";
import { SettingsPage } from "../settings-page";

export const dynamic = "force-dynamic";

export default async function FaqsSettingsPage() {
  await requireAdmin();
  const faqs = await getHomepageFaqs();

  return (
    <SettingsPage
      description={`Up to ${MAX_HOMEPAGE_FAQS} questions on the public homepage. You can add, edit, reorder, or remove them, and choose a category for the filters.`}
      title="FAQs"
    >
      <HomepageFaqManager faqs={faqs} maxFaqs={MAX_HOMEPAGE_FAQS} />
    </SettingsPage>
  );
}
