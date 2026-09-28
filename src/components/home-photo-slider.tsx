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
  const images = [...slides.map((slide) => ({ src: slide.src, alt: slide.alt })), ...PREVIEW_SAMPLE_PHOTOS];
  if (!enabled || images.length === 0) return null;

  return (
    <div className="relative">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <ImageSlider
        className="aspect-[2/1] h-auto"
        images={images}
        interval={5500}
        label="Photos from our walks"
        // No text sits over the photos, so there's nothing to keep legible.
        scrim={false}
      />
      <FullWidthDivider position="bottom" />
    </div>
  );
}

// PREVIEW ONLY — sample countryside photos so the slider can be tried with
// more than one slide. Code only, never saved to the database (previews
// share the live one). Remove before this goes live.
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=1600&q=70&auto=format&fit=crop`;
const PREVIEW_SAMPLE_PHOTOS = [
  { src: photo("1551632811-561732d1e306"), alt: "Two walkers on a rocky trail below snowy mountains" },
  { src: photo("1441974231531-c6227db76b6e"), alt: "A path through a tall, sunlit forest" },
  { src: photo("1470071459604-3b5ec3a7fe05"), alt: "Morning fog over green hills" },
  { src: photo("1500534623283-312aade485b7"), alt: "Sunset over layered hills" },
];
