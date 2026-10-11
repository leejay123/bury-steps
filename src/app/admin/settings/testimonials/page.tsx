import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
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
      description={`Up to ${MAX_HOMEPAGE_TESTIMONIALS} quotes on the public homepage. You can change the name, the line under the name, the testimonial text, and an optional photo. Remove any you do not want and add your own.`}
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
  const testimonials = await getHomepageTestimonials();

  return (
    <>
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
  const testimonials = await getHomepageTestimonials();
  return <HomepageTestimonialManager maxTestimonials={MAX_HOMEPAGE_TESTIMONIALS} testimonials={testimonials} />;
}
