import { requireAdmin } from "@/lib/auth";
import { ensureDefaultHomepageSlide, getHomepageSlides } from "@/lib/homepage-slides";
import { getSiteTheme } from "@/lib/site-theme";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { HomepageSlideManager } from "../../homepage/slide-manager";
import { SettingsPage } from "../settings-page";
import { CarouselToggle } from "./carousel-toggle";

export const dynamic = "force-dynamic";

export default async function HeroPhotosSettingsPage() {
  await requireAdmin();
  await ensureDefaultHomepageSlide();
  const [slides, theme] = await Promise.all([getHomepageSlides(), getSiteTheme()]);

  return (
    <SettingsPage
      description={`The carousel at the top of the public homepage. You can keep up to ${MAX_HOMEPAGE_SLIDES} slides, change each picture, and drag them into the order visitors will see. With two or more slides, the photos rotate automatically.`}
      title="Hero photos"
    >
      <div className="flex flex-col gap-6">
        <CarouselToggle enabled={theme.carouselEnabled} />
        <HomepageSlideManager maxSlides={MAX_HOMEPAGE_SLIDES} slides={slides} />
      </div>
    </SettingsPage>
  );
}
