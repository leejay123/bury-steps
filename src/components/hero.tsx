import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HomeCarousel } from "@/components/home-carousel";
import { DEFAULT_HERO_PATH, type SlideView } from "@/lib/slides";

export function HeroSection({
  slides,
  signInHref,
  signUpHref,
}: {
  slides: SlideView[];
  signInHref: string;
  signUpHref: string;
}) {
  const heroSlides =
    slides.length > 0
      ? slides
      : [{ id: "default", sortOrder: 0, alt: "Bury Steps Walking Group", src: DEFAULT_HERO_PATH }];

  return (
    <section>
      <div className="relative flex flex-col items-center justify-center gap-5 px-4 py-12 md:px-8 md:py-20 lg:py-24">
        <div aria-hidden="true" className="absolute inset-0 -z-1 size-full overflow-hidden">
          <div
            className={cn(
              "absolute -inset-x-20 inset-y-0 z-0 rounded-full",
              "bg-[radial-gradient(ellipse_at_center,theme(--color-foreground/.08),transparent,transparent)]",
              "blur-[50px]",
            )}
          />
        </div>

        <p
          className={cn(
            "text-xs font-medium tracking-[0.18em] text-primary uppercase",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-500 ease-out",
          )}
        >
          Support · Together · Empathy · Pace · Steps
        </p>

        <h1
          className={cn(
            "max-w-3xl text-balance text-center text-3xl text-foreground md:text-5xl lg:text-6xl",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-500 ease-out",
          )}
        >
          Bury Steps Walking Group
        </h1>

        <p
          className={cn(
            "max-w-2xl text-center text-muted-foreground text-sm tracking-wide sm:text-lg",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-200 duration-500 ease-out",
          )}
        >
          Sunday afternoons, Bury and the surrounding countryside. No winners, no losers — just
          people walking together.
        </p>

        <div className="fade-in slide-in-from-bottom-10 flex w-fit animate-in flex-wrap items-center justify-center gap-3 fill-mode-backwards pt-2 delay-300 duration-500 ease-out">
          <Button asChild>
            <a href={signUpHref}>
              Join the group
              <ArrowRightIcon data-icon="inline-end" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={signInHref}>Sign in</a>
          </Button>
        </div>
      </div>

      <div className="relative">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />
        <FullWidthDivider className="-top-px" />
        <div className="overflow-hidden bg-muted">
          {heroSlides.length > 1 ? (
            <HomeCarousel framed slides={heroSlides} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={heroSlides[0].alt}
              className="aspect-[2/1] w-full object-cover"
              src={heroSlides[0].src}
            />
          )}
        </div>
        <FullWidthDivider className="-bottom-px" />
      </div>
    </section>
  );
}
