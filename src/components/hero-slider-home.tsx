import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { JoinGroupButton } from "@/components/join-group-button";
import { ImageSlider } from "@/components/velora/image-slider";
import { SAMPLE_WALK_PHOTOS } from "@/lib/sample-walk-photos";
import type { SlideView } from "@/lib/slides";

/**
 * The photo slider as the hero: Homepage photos edge to edge, darkened
 * (the slider's scrim) so the site name, tagline and buttons read in white
 * on top. Falls back to the sample walking photos until photos are added.
 * Framed like the other heroes: bottom hairline and corner crosses.
 */
export function HeroSliderHome({
  slides,
  isSignedIn,
  signInHref,
  signUpHref,
  siteName,
  siteTagline,
}: {
  slides: SlideView[];
  isSignedIn: boolean;
  signInHref: string;
  signUpHref: string;
  siteName: string;
  siteTagline: string;
}) {
  const images = slides.length > 0 ? slides.map((slide) => ({ src: slide.src, alt: slide.alt })) : SAMPLE_WALK_PHOTOS;

  return (
    <div className="relative">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <FullWidthDivider position="bottom" />
      <ImageSlider
        className="h-[70svh] min-h-[28rem] max-h-[44rem]"
        images={images}
        interval={5500}
        label="Photos from our walks"
      >
        {/* Bottom-left, clear of the arrows (mid-height) and dots (bottom centre). */}
        <div className="flex size-full flex-col justify-end px-6 pt-16 pb-16 sm:px-12 sm:pb-20">
          <h1 className="max-w-3xl text-headline font-medium tracking-tight text-balance text-white">{siteName}</h1>
          {siteTagline ? (
            <p className="mt-4 max-w-xl text-intro text-pretty text-white/85">{siteTagline}</p>
          ) : null}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {isSignedIn ? (
              <Button asChild className="bg-white text-black hover:bg-white/90">
                <Link href="/walks">
                  See the walks <ArrowRightIcon />
                </Link>
              </Button>
            ) : (
              <>
                <JoinGroupButton href={signUpHref} />
                <Button
                  asChild
                  className="border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  size="sm"
                  variant="outline"
                >
                  <a href={signInHref}>Sign in</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </ImageSlider>
    </div>
  );
}
