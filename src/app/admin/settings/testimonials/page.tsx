import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { HomepageTestimonialManager } from "../../homepage/testimonial-manager";
import { SettingsContentSkeleton, SettingsPage } from "../settings-page";



export default function TestimonialsSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description={`Up to ${MAX_HOMEPAGE_TESTIMONIALS} quotes on the public homepage. You can change the name, the line under the name, the testimonial text, and an optional photo. Remove any you do not want and add your own.`}
      previewHref="/"
      title="Testimonials"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <TestimonialsSettingsPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function TestimonialsSettingsPageContent() {
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
