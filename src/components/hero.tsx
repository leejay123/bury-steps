import { AuthSwitch } from "@/components/signed-in-context";
import Link from "next/link";
import { HeroGuestActions } from "@/components/hero-guest-actions";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HeroCopy } from "@/components/hero-copy";
import type { SectionBgPattern } from "@/lib/section-background";

export function HeroSection({
  bgPattern = "dots",
  siteName,
  siteTagline,
}: {
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
            <AuthSwitch signedIn={<><Button asChild size="sm" variant="outline">
                <Link href="/walks">Your walks</Link>
              </Button></>} signedOut={<><HeroGuestActions className="contents" /></>} />
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
