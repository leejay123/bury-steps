import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsContentSkeleton, SettingsPage } from "../../settings-page";
import { TestimonialsSectionCopySettings } from "../testimonials-section-copy-settings";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function TestimonialsWordingPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="The heading and short intro above the quote grid on the homepage. The quotes themselves are managed under Testimonials."
      previewHref="/"
      title="Testimonials heading"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <TestimonialsWordingPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function TestimonialsWordingPageContent() {
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <>
      <TestimonialsSectionCopySettings
        testimonialsSectionEyebrow={theme.testimonialsSectionEyebrow}
        testimonialsSectionIntro={theme.testimonialsSectionIntro}
        testimonialsSectionTitle={theme.testimonialsSectionTitle}
      />
    </>
  );
}
