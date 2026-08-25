import { requireAdmin } from "@/lib/auth";
import { getHomepageSlides } from "@/lib/homepage-slides";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { AdminNav } from "../admin-nav";
import { HomepageSlideManager } from "./slide-manager";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  await requireAdmin();

  const slides = await getHomepageSlides();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Homepage</h1>
        <AdminNav current="homepage" />
      </div>
      <p className="text-sm text-muted-foreground">
        These photos are the carousel in the homepage hero. Add up to {MAX_HOMEPAGE_SLIDES} slides,
        change each picture, and move them into the order visitors will see. With two or more
        slides, the photos rotate automatically.
      </p>
      <HomepageSlideManager slides={slides} maxSlides={MAX_HOMEPAGE_SLIDES} />
    </div>
  );
}
