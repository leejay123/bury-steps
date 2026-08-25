import { requireAdmin } from "@/lib/auth";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { HomepageTestimonialManager } from "../../homepage/testimonial-manager";
import { SettingsPage } from "../settings-page";

export const dynamic = "force-dynamic";

export default async function TestimonialsSettingsPage() {
  await requireAdmin();
  const testimonials = await getHomepageTestimonials();

  return (
    <SettingsPage
      description={`Up to ${MAX_HOMEPAGE_TESTIMONIALS} quotes on the public homepage. You can change the name, the line under the name, the testimonial text, and an optional photo. Remove any you do not want and add your own.`}
      title="Testimonials"
    >
      <HomepageTestimonialManager
        maxTestimonials={MAX_HOMEPAGE_TESTIMONIALS}
        testimonials={testimonials}
      />
    </SettingsPage>
  );
}
