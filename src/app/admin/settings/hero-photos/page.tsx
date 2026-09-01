import { requireAdmin } from "@/lib/auth";
import { ensureDefaultHomepageSlide, getHomepageSlides } from "@/lib/homepage-slides";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { HomepageSlideManager } from "../../homepage/slide-manager";
import { SettingsPage } from "../settings-page";

export const dynamic = "force-dynamic";

export default async function HeroPhotosSettingsPage() {
  await requireAdmin();
  await ensureDefaultHomepageSlide();
  const slides = await getHomepageSlides();

  return (
    <SettingsPage
      description={`The carousel at the top of the public homepage. You can keep up to ${MAX_HOMEPAGE_SLIDES} slides, change each picture, and drag them into the order visitors will see. With two or more slides, the photos rotate automatically. Show or hide the carousel under Display → Layout.`}
      title="Hero photos"
    >
      <HomepageSlideManager maxSlides={MAX_HOMEPAGE_SLIDES} slides={slides} />
    </SettingsPage>
  );
}
