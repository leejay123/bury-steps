import { requireAdmin } from "@/lib/auth";
import { getHomepageSlides } from "@/lib/homepage-slides";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { HomepageSlideManager } from "../homepage/slide-manager";
import { HomepageTestimonialManager } from "../homepage/testimonial-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const [slides, testimonials] = await Promise.all([
    getHomepageSlides(),
    getHomepageTestimonials(),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hero photos</CardTitle>
          <CardDescription>
            The carousel at the top of the public homepage. You can keep up to {MAX_HOMEPAGE_SLIDES}{" "}
            slides, change each picture, and move them into the order visitors will see. With two or
            more slides, the photos rotate automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HomepageSlideManager slides={slides} maxSlides={MAX_HOMEPAGE_SLIDES} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Testimonials</CardTitle>
          <CardDescription>
            Up to {MAX_HOMEPAGE_TESTIMONIALS} quotes on the public homepage. For each one you can
            change the name, the line under the name, the testimonial text, and an optional photo.
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
