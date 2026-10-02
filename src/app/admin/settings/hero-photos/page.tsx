import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { ensureDefaultHomepageSlide, getHomepageSlides } from "@/lib/homepage-slides";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { HomepageSlideManager } from "../../homepage/slide-manager";
import { SettingsContentSkeleton, SettingsPage } from "../settings-page";



export default function HeroPhotosSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description={`The homepage's pictures: the Photo slider section, and the Photo slider, Parallax and 3D Marquee heroes. Keep up to ${MAX_HOMEPAGE_SLIDES}, change each picture, and drag them into the order visitors will see. Parallax shows 12 and 3D Marquee 15 — any gaps are filled with sample walking photos until you add your own.`}
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
  await requirePermission("permHomepage");
  await ensureDefaultHomepageSlide();
  const slides = await getHomepageSlides();

  return (
    <>
      <HomepageSlideManager maxSlides={MAX_HOMEPAGE_SLIDES} slides={slides} />
    </>
  );
}
