import Link from "next/link";
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
  signedIn = false,
  walksHref = "/dashboard",
  carouselEnabled = true,
}: {
  slides: SlideView[];
  signInHref: string;
  signUpHref: string;
  signedIn?: boolean;
  walksHref?: string;
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
          actions={
            signedIn ? (
              <Button asChild variant="outline">
                <Link href={walksHref}>Your walks</Link>
              </Button>
            ) : (
              <>
                <Button asChild>
                  <a href={signUpHref}>
                    Join the group
                    <ArrowRightIcon data-icon="inline-end" />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={signInHref}>Sign in</a>
                </Button>
              </>
            )
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
          <FullWidthDivider className="-top-px" />
          <FadeIn>
            <div className="overflow-hidden bg-muted">
              <HomeCarousel framed slides={slides} />
            </div>
          </FadeIn>
          <FullWidthDivider className="-bottom-px" />
        </div>
      ) : null}
    </section>
  );
}
