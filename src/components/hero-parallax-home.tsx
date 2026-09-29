import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { JoinGroupButton } from "@/components/join-group-button";
import { HeroParallax, type HeroParallaxProduct } from "@/components/velora/hero-parallax";
import type { SlideView } from "@/lib/slides";

const CARD_COUNT = 12;

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=70&auto=format&fit=crop`;

/** Stand-in walking photos. Organisers' own Homepage photos go first and
 * push these out one by one, so adding photos is how they get replaced. */
const SAMPLE_CARDS: HeroParallaxProduct[] = [
  { title: "On the trail", image: photo("1551632811-561732d1e306") },
  { title: "Forest path", image: photo("1441974231531-c6227db76b6e") },
  { title: "Morning fog", image: photo("1470071459604-3b5ec3a7fe05") },
  { title: "Hilltop sunset", image: photo("1500534623283-312aade485b7") },
  { title: "Boardwalk through the trees", image: photo("1447752875215-b2761acb3c5d") },
  { title: "Green hills", image: photo("1472214103451-9374bd1c798e") },
  { title: "Valley meadow", image: photo("1426604966848-d7adac402bff") },
  { title: "Waterfall bridge", image: photo("1433086966358-54859d0ed716") },
  { title: "Mountain lake", image: photo("1464822759023-fed622ff2c3b") },
  { title: "Sunlit moor", image: photo("1469474968028-56623f02e42e") },
  { title: "Lakeside", image: photo("1501785888041-af3ef285b470") },
  { title: "Above the clouds", image: photo("1506905925346-21bda4d32df4") },
];

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
  const own = slides.map((slide) => ({ title: slide.alt, image: slide.src }));
  const cards = [...own, ...SAMPLE_CARDS].slice(0, Math.max(CARD_COUNT, own.length));

  return (
    <div className="relative">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <FullWidthDivider position="bottom" />
      <HeroParallax products={cards}>
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
            <>
              <JoinGroupButton href={signUpHref} />
              <Button asChild size="sm" variant="outline">
                <a href={signInHref}>Sign in</a>
              </Button>
            </>
          )}
        </div>
      </HeroParallax>
    </div>
  );
}
