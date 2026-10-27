import { ImageSlider } from "@/components/velora/image-slider";
import type { SlideView } from "@/lib/slides";

/** The homepage photos (Admin → Homepage photos) as Velora's crossfading
 * image slider, edge to edge — the homepage's "Photo slider" section (placed
 * with Settings → Homepage layout → Section order). */
export function WalkPhotoSlider({ slides }: { slides: SlideView[] }) {
  return (
    <ImageSlider
      // Shorter on wider screens; each photo shown whole, a blurred copy of
      // it filling the sides (it was cropped to fill a taller box).
      className="aspect-video h-auto md:aspect-[3/1]"
      fit="whole"
      images={slides.map((slide) => ({ src: slide.src, alt: slide.alt }))}
      interval={5500}
      label="Photos from our walks"
      // No text sits over the photos, so there's nothing to keep legible.
      scrim={false}
    />
  );
}
