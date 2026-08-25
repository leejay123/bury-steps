import type { ReactNode } from "react";
import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HomeCarousel } from "@/components/home-carousel";
import type { SlideView } from "@/lib/slides";

export function HeroCopy({
  eyebrow = "Support · Together · Empathy · Pace · Steps",
  title,
  titleAs: Title = "h1",
  children,
  actions,
}: {
  eyebrow?: string;
  title: string;
  titleAs?: "h1" | "h2";
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
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

      <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">{eyebrow}</p>

      <Title
        className={cn(
          "max-w-3xl text-balance text-center text-3xl text-foreground md:text-5xl lg:text-6xl",
        )}
      >
        {title}
      </Title>

      <div className="max-w-2xl text-center text-muted-foreground text-sm tracking-wide sm:text-lg">
        {children}
      </div>

      {actions ? (
        <div className="flex w-fit flex-wrap items-center justify-center gap-3 pt-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function HeroSection({
  slides,
  signInHref,
  signUpHref,
}: {
  slides: SlideView[];
  signInHref: string;
  signUpHref: string;
}) {
  return (
    <section>
      <HeroCopy title="Bury Steps Walking Group" titleAs="h1"
        actions={
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
        }
      >
        <p>
          Sunday afternoons, Bury and the surrounding countryside. No winners, no losers — just
          people walking together.
        </p>
      </HeroCopy>

      <div className="relative">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />
        <FullWidthDivider className="-top-px" />
        <div className="overflow-hidden bg-muted">
          <HomeCarousel framed slides={slides} />
        </div>
        <FullWidthDivider className="-bottom-px" />
      </div>
    </section>
  );
}
