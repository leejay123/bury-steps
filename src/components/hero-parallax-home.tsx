import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HeroGuestActions } from "@/components/hero-guest-actions";
import { HeroParallax } from "@/components/velora/hero-parallax";
import { SAMPLE_WALK_PHOTOS } from "@/lib/sample-walk-photos";
import type { SlideView } from "@/lib/slides";

const CARD_COUNT = 12;


/**
 * Velora's Hero Parallax: the site name and buttons over three rows of
 * photo cards that slide apart as the tilted block flattens on scroll.
 * Cards are the Homepage photos, topped up with sample walking photos until
 * there are enough to fill the rows. Framed like the other heroes: bottom
 * hairline and corner crosses.
 */
export function HeroParallaxHome({
  slides,
  isSignedIn,
  siteName,
  siteTagline,
}: {
  slides: SlideView[];
  isSignedIn: boolean;
  siteName: string;
  siteTagline: string;
}) {
  const own = slides.map((slide) => ({ title: slide.alt, image: slide.src }));
  const samples = SAMPLE_WALK_PHOTOS.map((sample) => ({ title: sample.alt, image: sample.src }));
  const cards = [...own, ...samples].slice(0, Math.max(CARD_COUNT, own.length));

  return (
    <div className="relative">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <FullWidthDivider position="bottom" />
      {/* Tighter than Velora's full-screen defaults: less air above the
          name and below the last row of cards. */}
      <HeroParallax className="pb-10 sm:pb-12" copyClassName="pt-10 pb-10 sm:pt-14" products={cards}>
        <h1 className="text-headline font-medium tracking-tight text-balance">{siteName}</h1>
        {siteTagline ? <p className="mt-6 max-w-xl text-intro text-pretty text-muted-foreground">{siteTagline}</p> : null}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {isSignedIn ? (
            <Button asChild>
              <Link href="/walks">
                See the walks <ArrowRightIcon />
              </Link>
            </Button>
          ) : (
            <HeroGuestActions className="contents" />
          )}
        </div>
      </HeroParallax>
    </div>
  );
}
