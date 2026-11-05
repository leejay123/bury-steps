import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { getOptionalAdmin, requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { TestimonialsSectionCopySettings } from "../site-wording/testimonials-section-copy-settings";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { HomepageTestimonialManager } from "../../homepage/testimonial-manager";
import { SettingsPage } from "../settings-page";
import { PlaceholderPreview } from "@/components/placeholder-preview";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function TestimonialsSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description={`Up to ${MAX_HOMEPAGE_TESTIMONIALS} quotes on the homepage. Change the name, the line under it, the quote and an optional photo, and the heading above them.`}
      previewHref="/"
      title="Testimonials"
    >
      <Suspense fallback={<SettingsFallback />}>
        <PlaceholderPreview fallback={<SettingsFallback />}>
          <TestimonialsSettingsPageContent />
        </PlaceholderPreview>
      </Suspense>
    </SettingsPage>
  );
}

async function TestimonialsSettingsPageContent() {
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  await requirePermission("permHomepage");
  // The homepage heading above them is site wording (permDisplay): shown to those who may change it.
  const [admin, theme] = await Promise.all([getOptionalAdmin(), getSiteTheme()]);
  const testimonials = await getHomepageTestimonials();

  return (
    <>
      {admin?.permDisplay ? (
        <TestimonialsSectionCopySettings
          testimonialsSectionEyebrow={theme.testimonialsSectionEyebrow}
          testimonialsSectionIntro={theme.testimonialsSectionIntro}
          testimonialsSectionTitle={theme.testimonialsSectionTitle}
        />
      ) : null}
      <HomepageTestimonialManager
        maxTestimonials={MAX_HOMEPAGE_TESTIMONIALS}
        testimonials={testimonials}
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
  const [testimonials, theme] = await Promise.all([getHomepageTestimonials(), getSiteTheme()]);
  return (
    <>
      <TestimonialsSectionCopySettings
        testimonialsSectionEyebrow={theme.testimonialsSectionEyebrow}
        testimonialsSectionIntro={theme.testimonialsSectionIntro}
        testimonialsSectionTitle={theme.testimonialsSectionTitle}
      />
      <HomepageTestimonialManager maxTestimonials={MAX_HOMEPAGE_TESTIMONIALS} testimonials={testimonials} />
    </>
  );
}
