import { requireAdmin } from "@/lib/auth";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { HomepageTestimonialManager } from "../../homepage/testimonial-manager";
import { SettingsBackLink } from "../settings-back-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function TestimonialsSettingsPage() {
  await requireAdmin();
  const testimonials = await getHomepageTestimonials();

  return (
    <div className="flex flex-col gap-4">
      <SettingsBackLink />
      <Card>
        <CardHeader>
          <CardTitle>Testimonials</CardTitle>
          <CardDescription>
            Up to {MAX_HOMEPAGE_TESTIMONIALS} quotes on the public homepage. For each one you can
            change the name, the line under the name, the testimonial text, and an optional photo.
            Remove any you do not want and add your own.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HomepageTestimonialManager
            testimonials={testimonials}
            maxTestimonials={MAX_HOMEPAGE_TESTIMONIALS}
          />
        </CardContent>
      </Card>
    </div>
  );
}
