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
 * Decorative: walks are all too close to Bury for a line to show on a whole
 * globe, so the lines sweep out to world cities instead, like Velora's demo.
 */
// Unnamed on purpose: they're decoration, not places the group goes. A few
// long ones sweep across the globe; the rest fan out close around Bury.
const WORLD: GlobeMarker[] = [
  { lat: 40.71, lng: -74.01 },
  { lat: -23.55, lng: -46.63 },
  { lat: 6.52, lng: 3.38 },
  { lat: 25.2, lng: 55.27 },
  { lat: 64.15, lng: -21.94 },
  { lat: 60.4, lng: 5.3 },
  { lat: 48.9, lng: 2.35 },
  { lat: 43.3, lng: -8.4 },
  { lat: 52.4, lng: 13.4 },
  { lat: 57.5, lng: -13.5 },
  { lat: 46.2, lng: 9.0 },
];

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
  const markers: GlobeMarker[] = [{ lat: BURY[0], lng: BURY[1], label: "Bury Steps" }, ...WORLD];
  const arcs: GlobeArc[] = WORLD.map((city) => ({ from: BURY, to: [city.lat, city.lng] }));
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
      <section className="relative isolate overflow-hidden px-4 pt-16 pb-10 sm:px-6 sm:pt-20 sm:pb-12 lg:px-8">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 -z-10 w-full bg-radial-[at_75%_50%] from-[oklch(0.62_0.19_259)]/10 to-transparent to-60% lg:w-2/3"
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
              <dl className="mt-10 grid grid-cols-3 gap-6 border-t pt-6">
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
              accentColor="oklch(0.62 0.19 259)"
              arcs={arcs}
              center={[35, -15]}
              className="w-full max-w-[min(100%,30rem)]"
              label="Globe with lines from Bury out to cities around the world"
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
