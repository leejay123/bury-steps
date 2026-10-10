import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { ensureDefaultHomepageSlide, getHomepageSlides } from "@/lib/homepage-slides";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { HomepageSlideManager } from "../../homepage/slide-manager";
import { SettingsContentSkeleton, SettingsPage } from "../settings-page";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function HeroPhotosSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description={`The homepage's pictures: the Photo slider section and every photo hero (Photo slider, Parallax, 3D Marquee, Sideways strip, Tiles, Diagonal rows and Accordion). Keep up to ${MAX_HOMEPAGE_SLIDES}, change each picture, and use the arrows to put them in the order visitors will see. A hero that shows more photos than you have (Parallax 12, 3D Marquee 15) fills the gaps with sample walking photos until you add your own.`}
      previewHref="/"
      title="Hero photos"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <HeroPhotosSettingsPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function HeroPhotosSettingsPageContent() {
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  await requirePermission("permHomepage");
  await ensureDefaultHomepageSlide();
  const slides = await getHomepageSlides();

  return (
    <>
      <HomepageSlideManager maxSlides={MAX_HOMEPAGE_SLIDES} slides={slides} />
    </>
  );
}
