import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HeroGuestActions } from "@/components/hero-guest-actions";
import { Marquee3D } from "@/components/velora/3d-marquee";
import { SAMPLE_WALK_PHOTOS } from "@/lib/sample-walk-photos";
import type { SlideView } from "@/lib/slides";

/** Enough tiles that six columns never visibly repeat side by side. */
const TILE_COUNT = 15;

/**
 * Velora's 3D Marquee as a hero: a tilted wall of walk photos scrolling up
 * and down behind the centred site name and buttons. Tiles are the Homepage
 * photos, topped up with sample walking photos. Framed like the other
 * heroes: bottom hairline and corner crosses.
 */
export function HeroMarqueeHome({
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
  const own = slides.map((slide) => ({ src: slide.src, alt: slide.alt }));
  const images = [...own, ...SAMPLE_WALK_PHOTOS].slice(0, Math.max(TILE_COUNT, own.length));

  return (
    <div className="relative">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <FullWidthDivider position="bottom" />
      <section className="relative isolate overflow-hidden">
        <Marquee3D
          className="absolute inset-0 -z-10 h-full opacity-60 dark:opacity-45"
          columns={6}
          duration={60}
          images={images}
          pauseOnHover={false}
        />
        {/* Keeps the words readable over the photos. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-radial from-background from-25% via-background/80 to-background/10"
        />
        <div className="flex min-h-[28rem] flex-col items-center justify-center px-6 py-14 text-center sm:min-h-[34rem]">
          <h1 className="max-w-3xl text-headline font-medium tracking-tight text-balance">{siteName}</h1>
          {siteTagline ? (
            <p className="mt-5 max-w-xl text-intro text-pretty text-muted-foreground">{siteTagline}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
        </div>
      </section>
    </div>
  );
}
