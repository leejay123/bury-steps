import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { JoinGroupButton } from "@/components/join-group-button";
import { BlurFade } from "@/components/velora/blur-fade";
import { Globe, type GlobeArc, type GlobeMarker } from "@/components/velora/globe";
import { NumberTicker } from "@/components/velora/number-ticker";
import { BURY, type HomepageGlobeData } from "@/lib/homepage-globe";

/**
 * Velora's "Globe split hero": words, buttons and live numbers on the left,
 * a spinning dotted globe on the right with a dot on every walk's meeting
 * point and a line out to it from Bury. Stacks with the globe below on phones.
 */
export function HeroGlobe({
  data,
  isSignedIn,
  signInHref,
  signUpHref,
  siteName,
  siteTagline,
}: {
  data: HomepageGlobeData;
  isSignedIn: boolean;
  signInHref: string;
  signUpHref: string;
  siteName: string;
  siteTagline: string;
}) {
  const markers: GlobeMarker[] = [
    { lat: BURY[0], lng: BURY[1], label: "Bury Steps" },
    ...data.points.map(([lat, lng]) => ({ lat, lng })),
  ];
  const arcs: GlobeArc[] = data.points.map((point) => ({ from: BURY, to: point }));
  const stats = [
    { value: data.upcomingWalks, label: "walks coming up" },
    { value: data.members, label: "members" },
    { value: data.walksThisYear, label: `walks so far in ${new Date().getFullYear()}` },
  ];

  return (
    <div className="relative">
      {/* Same framed edge as the grid hero: corner marks and a full-width line underneath. */}
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <FullWidthDivider position="bottom" />
      <section className="relative isolate overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 -z-10 w-full bg-radial-[at_75%_50%] from-primary/10 to-transparent to-60% lg:w-2/3"
        />

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="max-w-xl">
            <BlurFade>
              <Link
                className="inline-flex items-center gap-2 rounded-full border bg-background/60 py-1 pr-3 pl-1 text-sm text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
                href="/walks"
              >
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Walks</span>
                {data.upcomingWalks > 0 ? `${data.upcomingWalks} coming up` : "See where we walk"}
                <ArrowRightIcon className="size-3.5" />
              </Link>
            </BlurFade>

            <h1 className="mt-8 text-headline font-medium tracking-tight text-balance">{siteName}</h1>

            {siteTagline ? <p className="mt-6 text-intro text-pretty text-muted-foreground">{siteTagline}</p> : null}

            <BlurFade delay={0.3}>
              <div className="mt-10 flex flex-wrap items-center gap-3">
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
            </BlurFade>

            <BlurFade delay={0.4}>
              <dl className="mt-14 grid grid-cols-3 gap-6 border-t pt-8">
                {stats.map((stat) => (
                  <div className="flex flex-col-reverse justify-end gap-1" key={stat.label}>
                    <dt className="text-xs text-muted-foreground sm:text-sm">{stat.label}</dt>
                    <dd className="text-2xl font-medium tracking-tight sm:text-3xl">
                      <NumberTicker value={stat.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </BlurFade>
          </div>

          <BlurFade className="relative flex justify-center" delay={0.2} direction="none">
            <Globe
              accentColor="var(--primary)"
              arcs={arcs}
              center={[50, -2]}
              className="w-full max-w-[min(100%,34rem)]"
              label="Globe showing where Bury Steps walks meet"
              markers={markers}
              samples={20000}
            speed={0}
            />
          </BlurFade>
        </div>
      </section>
    </div>
  );
}
