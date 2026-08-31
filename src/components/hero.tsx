import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HomeCarousel } from "@/components/home-carousel";
import { HeroCopy } from "@/components/hero-copy";
import { FadeIn } from "@/components/motion";
import type { SlideView } from "@/lib/slides";

export { HeroCopy };

export function HeroSection({
  slides,
  signInHref,
  signUpHref,
  carouselEnabled = true,
  siteName,
  siteTagline,
}: {
  slides: SlideView[];
  signInHref: string;
  signUpHref: string;
  carouselEnabled?: boolean;
  siteName: string;
  siteTagline: string;
}) {
  // Turned on in settings is necessary but not sufficient — with zero
  // slides there's nothing for the carousel to show, so treat that the same
  // as turned off rather than rendering an empty grey strip.
  const showCarousel = carouselEnabled && slides.length > 0;

  return (
    <section>
      <div className="relative">
        {!showCarousel ? (
          <>
            <DecorIcon className="size-4" position="top-left" />
            <DecorIcon className="size-4" position="top-right" />
            <DecorIcon className="size-4" position="bottom-left" />
            <DecorIcon className="size-4" position="bottom-right" />
            <FullWidthDivider position="top" />
            <FullWidthDivider position="bottom" />
          </>
        ) : null}
        <HeroCopy
          dotPattern
          actions={
            <>
              <Show when="signed-in">
                <Button asChild variant="outline">
                  <Link href="/dashboard">Your walks</Link>
                </Button>
              </Show>
              <Show when="signed-out">
                <Button asChild>
                  <a href={signUpHref}>
                    Join the group
                    <ArrowRightIcon data-icon="inline-end" />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={signInHref}>Sign in</a>
                </Button>
              </Show>
            </>
          }
          title={siteName}
          titleAs="h1"
        >
          <p>{siteTagline}</p>
        </HeroCopy>
      </div>

      {showCarousel ? (
        <div className="relative">
          <DecorIcon className="size-4" position="top-left" />
          <DecorIcon className="size-4" position="top-right" />
          <DecorIcon className="size-4" position="bottom-left" />
          <DecorIcon className="size-4" position="bottom-right" />
          <FullWidthDivider position="top" />
          <div className="overflow-hidden bg-muted">
            <FadeIn>
              <HomeCarousel framed slides={slides} />
            </FadeIn>
          </div>
          <FullWidthDivider position="bottom" />
        </div>
      ) : null}
    </section>
  );
}
