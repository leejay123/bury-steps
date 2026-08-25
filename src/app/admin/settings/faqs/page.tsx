import { requireAdmin } from "@/lib/auth";
import { getHomepageFaqs } from "@/lib/homepage-faqs";
import { MAX_HOMEPAGE_FAQS } from "@/lib/faqs";
import { HomepageFaqManager } from "../../homepage/faq-manager";
import { SettingsBackLink } from "../settings-back-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function FaqsSettingsPage() {
  await requireAdmin();
  const faqs = await getHomepageFaqs();

  return (
    <div className="flex flex-col gap-4">
      <SettingsBackLink />
      <Card>
        <CardHeader>
          <CardTitle>FAQs</CardTitle>
          <CardDescription>
            Up to {MAX_HOMEPAGE_FAQS} questions on the public homepage. You can add, edit, reorder,
            or remove them, and choose a category for the filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HomepageFaqManager faqs={faqs} maxFaqs={MAX_HOMEPAGE_FAQS} />
        </CardContent>
      </Card>
    </div>
  );
}
