import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { ensureDefaultHomepageSlide, getHomepageSlides } from "@/lib/homepage-slides";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { HomepageSlideManager } from "../../homepage/slide-manager";
import { SettingsPage } from "../settings-page";
import { PlaceholderPreview } from "@/components/placeholder-preview";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function HeroPhotosSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description={`Up to 15 homepage photos for the slider and photo heroes. Use the arrows to set the order visitors see.`}
      previewHref="/"
      title="Hero photos"
    >
      <Suspense fallback={<SettingsFallback />}>
        <PlaceholderPreview fallback={<SettingsFallback />}>
          <HeroPhotosSettingsPageContent />
        </PlaceholderPreview>
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

/**
 * While the page checks who you are: the real list, from the same shared
 * saved copy the homepage uses (these photos are public anyway), so a
 * refresh shows them at once instead of an empty space.
 */
async function SettingsFallback() {
  const slides = await getHomepageSlides();
  return <HomepageSlideManager maxSlides={MAX_HOMEPAGE_SLIDES} slides={slides} />;
}
