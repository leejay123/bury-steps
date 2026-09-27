import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { ArrowUpRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HomeCarousel } from "@/components/home-carousel";
import { HeroCopy } from "@/components/hero-copy";
import { FadeIn } from "@/components/motion";
import { JoinGroupButton } from "@/components/join-group-button";
import { formatWalkDate } from "@/lib/dates";
import { walkSharePath } from "@/lib/walk-slug";
import type { SlideView } from "@/lib/slides";
import type { SectionBgPattern } from "@/lib/section-background";

type NextWalk = { slug: string | null; startsAt: Date; title: string; token: string };

function NextWalkPill({ walk }: { walk: NextWalk }) {
  return (
    <Link
      className="flex max-w-full items-center divide-x overflow-hidden rounded-full border bg-background text-sm shadow-xs transition-colors hover:bg-muted"
      href={walkSharePath(walk)}
    >
      <span className="shrink-0 px-3 py-1.5 font-medium text-foreground">Next walk</span>
      <span className="flex min-w-0 items-center gap-1.5 px-3 py-1.5 text-muted-foreground">
        <span className="truncate">{formatWalkDate(walk.startsAt)}</span>
        <ArrowUpRightIcon aria-hidden className="size-3.5 shrink-0" />
      </span>
    </Link>
  );
}

// Splits the site name so the first half reads bold and the rest softer,
// with the logo tucked between them.
function TwoToneTitle({ logoSrc, name }: { logoSrc: string; name: string }) {
  const words = name.trim().split(/\s+/);
  const cut = Math.ceil(words.length / 2);
  const first = words.slice(0, cut).join(" ");
  const rest = words.slice(cut).join(" ");
  return (
    <>
      <span className="text-foreground">{first}</span>{" "}
      {/* eslint-disable-next-line @next/next/no-img-element -- logo is served from our own API route */}
      <img
        alt=""
        aria-hidden
        className="inline-block size-[0.85em] -translate-y-[0.06em] rounded-full border bg-background object-contain align-middle"
        src={logoSrc}
      />
      {rest ? (
        <>
          {" "}
          <span className="text-muted-foreground">{rest}</span>
        </>
      ) : null}
    </>
  );
}

export function HeroSection({
  logoSrc,
  nextWalk,
  slides,
  signInHref,
  signUpHref,
  bgPattern = "dots",
  carouselEnabled = true,
  siteName,
  siteTagline,
}: {
  logoSrc: string;
  nextWalk: NextWalk | null;
  slides: SlideView[];
  signInHref: string;
  signUpHref: string;
  bgPattern?: SectionBgPattern;
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
          announcement={nextWalk ? <NextWalkPill walk={nextWalk} /> : null}
          bgPattern={bgPattern}
          actions={
            <>
              <Show when="signed-in">
                <Button asChild variant="outline">
                  <Link href="/walks">Your walks</Link>
                </Button>
              </Show>
              <Show when="signed-out">
                <Button asChild size="sm" variant="outline">
                  <a href={signInHref}>Sign in</a>
                </Button>
                <JoinGroupButton href={signUpHref} />
              </Show>
            </>
          }
          eyebrow={null}
          title={<TwoToneTitle logoSrc={logoSrc} name={siteName} />}
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
          <div className="p-3 md:p-4">
            <div className="overflow-hidden rounded-xl border bg-muted shadow-xs">
              <FadeIn>
                <HomeCarousel framed slides={slides} />
              </FadeIn>
            </div>
          </div>
          <FullWidthDivider position="bottom" />
        </div>
      ) : null}
    </section>
  );
}
