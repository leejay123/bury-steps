import { requirePermission } from "@/lib/auth";
import { ensureDefaultHomepageSlide, getHomepageSlides } from "@/lib/homepage-slides";
import { MAX_HOMEPAGE_SLIDES } from "@/lib/slides";
import { HomepageSlideManager } from "../../homepage/slide-manager";
import { SettingsPage } from "../settings-page";



export default async function HeroPhotosSettingsPage() {
  await requirePermission("permHomepage");
  await ensureDefaultHomepageSlide();
  const slides = await getHomepageSlides();

  return (
    <SettingsPage
      description={`The homepage's pictures: the Photo slider section, and the Photo slider, Parallax and 3D Marquee heroes. Keep up to ${MAX_HOMEPAGE_SLIDES}, change each picture, and drag them into the order visitors will see. Parallax shows 12 and 3D Marquee 15 — any gaps are filled with sample walking photos until you add your own.`}
      previewHref="/"
      title="Hero photos"
    >
      <HomepageSlideManager maxSlides={MAX_HOMEPAGE_SLIDES} slides={slides} />
    </SettingsPage>
  );
}
