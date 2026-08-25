import { requireAdmin } from "@/lib/auth";
import { getHomepageSlides } from "@/lib/homepage-slides";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { AdminNav } from "../admin-nav";
import { HomepageSlideManager } from "./slide-manager";
import { HomepageTestimonialManager } from "./testimonial-manager";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  await requireAdmin();

  const [slides, testimonials] = await Promise.all([
    getHomepageSlides(),
    getHomepageTestimonials(),
  ]);

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Homepage</h1>
        <AdminNav current="homepage" />
      </div>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Hero photos</h2>
          <p className="text-sm text-muted-foreground">
            These photos are the carousel in the homepage hero. Add up to {MAX_HOMEPAGE_SLIDES}{" "}
            slides, change each picture, and move them into the order visitors will see. With two
            or more slides, the photos rotate automatically.
          </p>
        </div>
        <HomepageSlideManager slides={slides} maxSlides={MAX_HOMEPAGE_SLIDES} />
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Testimonials</h2>
          <p className="text-sm text-muted-foreground">
            Up to {MAX_HOMEPAGE_TESTIMONIALS} quotes on the public homepage. For each one you can
            change the name, the line under the name, the testimonial text, and an optional photo.
          </p>
        </div>
        <HomepageTestimonialManager
          testimonials={testimonials}
          maxTestimonials={MAX_HOMEPAGE_TESTIMONIALS}
        />
      </section>
    </div>
  );
}
