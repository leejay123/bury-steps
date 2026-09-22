import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../../settings-page";
import { TestimonialsSectionCopySettings } from "../testimonials-section-copy-settings";

export const dynamic = "force-dynamic";

export default async function TestimonialsWordingPage() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="The heading and short intro above the quote grid on the homepage. The quotes themselves are managed under Testimonials."
      previewHref="/"
      title="Testimonials heading"
    >
      <TestimonialsSectionCopySettings
        testimonialsSectionEyebrow={theme.testimonialsSectionEyebrow}
        testimonialsSectionIntro={theme.testimonialsSectionIntro}
        testimonialsSectionTitle={theme.testimonialsSectionTitle}
      />
    </SettingsPage>
  );
}
