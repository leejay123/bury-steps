import { requireAdmin } from "@/lib/auth";
import { getHomepageSlides } from "@/lib/homepage-slides";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { MAX_HOMEPAGE_TESTIMONIALS } from "@/lib/testimonials";
import { AdminNav } from "../admin-nav";
import { HomepageSlideManager } from "../homepage/slide-manager";
import { HomepageTestimonialManager } from "../homepage/testimonial-manager";
import { SettingsTabs } from "./settings-tabs";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const [slides, testimonials] = await Promise.all([
    getHomepageSlides(),
    getHomepageTestimonials(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <AdminNav current="settings" />
      </div>
      <SettingsTabs
        photos={<HomepageSlideManager slides={slides} maxSlides={MAX_HOMEPAGE_SLIDES} />}
        testimonials={
          <HomepageTestimonialManager
            testimonials={testimonials}
            maxTestimonials={MAX_HOMEPAGE_TESTIMONIALS}
          />
        }
      />
    </div>
  );
}
