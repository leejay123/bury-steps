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
}: {
  slides: SlideView[];
  signInHref: string;
  signUpHref: string;
  carouselEnabled?: boolean;
}) {
  return (
    <section>
      <div className="relative">
        {!carouselEnabled ? (
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
          title="Bury Steps Walking Group"
          titleAs="h1"
        >
          <p>
            Sunday afternoons, Bury and the surrounding countryside. No winners, no losers — just
            people walking together.
          </p>
        </HeroCopy>
      </div>

      {carouselEnabled ? (
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
