import { AuthSwitch } from "@/components/signed-in-context";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HeroGuestActions } from "@/components/hero-guest-actions";
import { ImageSlider } from "@/components/velora/image-slider";
import type { SliderHeroWords } from "@/lib/hero-style";
import { SAMPLE_WALK_PHOTOS } from "@/lib/sample-walk-photos";
import type { SlideView } from "@/lib/slides";

/**
 * The photo slider as the hero: Homepage photos edge to edge. What's
 * written over them is an organiser choice (Homepage layout → "Words on the
 * photos"): the site name and tagline on every photo, each photo's own
 * heading and text (blank photos show just the picture), or no words at
 * all. The Join / Sign in buttons only appear alongside words. Falls back
 * to the sample walking photos until photos are added. Framed like the
 * other heroes: bottom hairline and corner crosses.
 */
export function HeroSliderHome({
  slides,
  words,
  siteName,
  siteTagline,
}: {
  slides: SlideView[];
  words: SliderHeroWords;
  siteName: string;
  siteTagline: string;
}) {
  const images = slides.length > 0 ? slides.map((slide) => ({ src: slide.src, alt: slide.alt, blur: slide.blur })) : SAMPLE_WALK_PHOTOS;

  const actions = <AuthSwitch signedIn={<><Button asChild className="bg-white text-black hover:bg-white/90" size="sm">
      <Link href="/walks">
        See the walks <ArrowRightIcon />
      </Link>
    </Button></>} signedOut={<><HeroGuestActions className="contents" tone="dark" /></>} />;

  // Bottom-left, clear of the arrows (mid-height) and dots (bottom centre).
  // With the site name on every photo it's the page's h1; a photo's own
  // heading is a p, since the (visually hidden) site name is the h1 then.
  const overlay = (heading: string, text: string, asHeading: boolean) => {
    const Heading = asHeading ? "h1" : "p";
    return (
      <div className="flex size-full flex-col justify-end px-6 pt-16 pb-16 sm:px-12 sm:pb-20">
        {heading ? (
          <Heading className="max-w-3xl text-headline font-medium tracking-tight text-balance text-white">
            {heading}
          </Heading>
        ) : null}
        {text ? <p className="mt-4 max-w-xl text-intro text-pretty text-white/85">{text}</p> : null}
        <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div>
      </div>
    );
  };

  const perSlide =
    words === "slides"
      ? slides.map((slide) =>
          slide.heading || slide.caption ? overlay(slide.heading, slide.caption, false) : null,
        )
      : undefined;

  return (
    <div className="relative">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <FullWidthDivider position="bottom" />
      {/* The page still needs a main heading when the photos carry none of their own. */}
      {words !== "site" ? <h1 className="sr-only">{siteName}</h1> : null}
      <ImageSlider
        className="h-[70svh] min-h-[28rem] max-h-[44rem]"
        images={images}
        interval={5500}
        label="Photos from our walks"
        // The darkening is only there to keep words readable.
        scrim={words !== "none"}
        slideChildren={words === "none" ? [] : perSlide}
      >
        {words === "site" ? overlay(siteName, siteTagline, true) : null}
      </ImageSlider>
    </div>
  );
}
