import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { ImageSlider } from "@/components/velora/image-slider";
import type { SlideView } from "@/lib/slides";

/**
 * The homepage photos (Admin → Homepage photos) as Velora's crossfading
 * image slider, framed edge to edge like the old hero carousel: full-width
 * hairline underneath and corner crosses. The hero above supplies the top
 * line. Hidden when the carousel is switched off or there are no photos.
 */
export function HomePhotoSlider({ slides, enabled }: { slides: SlideView[]; enabled: boolean }) {
  if (!enabled || slides.length === 0) return null;

  return (
    <div className="relative">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <ImageSlider
        className="aspect-[2/1] h-auto"
        images={slides.map((slide) => ({ src: slide.src, alt: slide.alt }))}
        interval={5500}
        label="Photos from our walks"
        // No text sits over the photos, so there's nothing to keep legible.
        scrim={false}
      />
      <FullWidthDivider position="bottom" />
    </div>
  );
}
