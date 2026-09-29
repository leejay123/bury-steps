import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HeroCopy } from "@/components/hero-copy";
import type { SectionBgPattern } from "@/lib/section-background";

export function HeroSection({
  signInHref,
  signUpHref,
  bgPattern = "dots",
  siteName,
  siteTagline,
}: {
  signInHref: string;
  signUpHref: string;
  bgPattern?: SectionBgPattern;
  siteName: string;
  siteTagline: string;
}) {
  return (
    <section>
      <div className="relative">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />
        <FullWidthDivider position="top" />
        <FullWidthDivider position="bottom" />
        <HeroCopy
          bgPattern={bgPattern}
          actions={
            <>
              <Show when="signed-in">
                <Button asChild variant="outline">
                  <Link href="/walks">Your walks</Link>
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

    </section>
  );
}
