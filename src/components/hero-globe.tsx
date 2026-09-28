import Link from "next/link";
import { ArrowRightIcon, CalendarDaysIcon, FootprintsIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { JoinGroupButton } from "@/components/join-group-button";
import { BlurFade } from "@/components/velora/blur-fade";
import { Globe, type GlobeArc } from "@/components/velora/globe";
import { NumberTicker } from "@/components/velora/number-ticker";
import { BURY, type HomepageGlobeData } from "@/lib/homepage-globe";

/**
 * Decorative lines only: no pins, no names. Walks are all too close to Bury
 * for a line to show on a whole globe, so these sweep out from Bury, plus a
 * few crossing other parts of the world, like Velora's demo.
 */
const LINES: GlobeArc[] = [
  ...[
    [40.71, -74.01],
    [-23.55, -46.63],
    [6.52, 3.38],
    [25.2, 55.27],
    [64.15, -21.94],
    [60.4, 5.3],
    [48.9, 2.35],
    [43.3, -8.4],
    [52.4, 13.4],
    [57.5, -13.5],
    [46.2, 9.0],
  ].map(([lat, lng]) => ({ from: BURY, to: [lat, lng] as [number, number] })),
  { from: [40.71, -74.01], to: [-23.55, -46.63] },
  { from: [-23.55, -46.63], to: [6.52, 3.38] },
  { from: [6.52, 3.38], to: [25.2, 55.27] },
  { from: [34.05, -118.24], to: [40.71, -74.01] },
  { from: [30.04, 31.24], to: [-33.92, 18.42] },
  { from: [19.43, -99.13], to: [4.71, -74.07] },
];

/**
 * Velora's "Globe split hero": words, buttons and live numbers (as cards) on
 * the left, a dotted globe with animated lines on the right. Phones get the
 * words and cards only; the globe is hidden below the lg breakpoint.
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
  const stats = [
    { value: data.upcomingWalks, label: "walks coming up", Icon: CalendarDaysIcon },
    { value: data.members, label: "members", Icon: UsersIcon },
    { value: data.walksThisYear, label: `walks so far in ${new Date().getFullYear()}`, Icon: FootprintsIcon },
  ];

  return (
    <div className="relative">
      {/* Same framed edge as the grid hero: corner marks and a full-width line underneath. */}
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <FullWidthDivider position="bottom" />
      <section className="relative isolate overflow-hidden px-4 pt-8 pb-10 sm:px-6 sm:pt-10 sm:pb-12 lg:px-8">
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
              {/* Same hairline grid and corner crosses as the homepage's feature
                  row, so the numbers read as part of the site's grid. Runs to
                  the page edges on phones, like the other full-width rows. */}
              <div className="relative -mx-4 mt-10 border-y sm:-mx-6 lg:mx-0 lg:border-x">
                <DecorIcon className="size-4" position="top-left" />
                <DecorIcon className="size-4" position="top-right" />
                <DecorIcon className="size-4" position="bottom-left" />
                <DecorIcon className="size-4" position="bottom-right" />
                <dl className="grid grid-cols-3 gap-px bg-border">
                  {stats.map(({ Icon, ...stat }) => (
                    <div className="flex flex-col-reverse justify-end gap-1 bg-background p-4 sm:p-5 lg:px-4 lg:py-3" key={stat.label}>
                      <dt className="text-xs text-muted-foreground sm:text-sm">{stat.label}</dt>
                      <dd className="text-2xl font-medium tracking-tight sm:text-3xl lg:text-2xl">
                        <NumberTicker value={stat.value} />
                      </dd>
                      {/* Same blue as the globe's lines. */}
                      <Icon aria-hidden className="mb-3 size-5 text-[oklch(0.55_0.2_262)] lg:mb-2 lg:size-4" />
                    </div>
                  ))}
                </dl>
              </div>
            </BlurFade>
          </div>

          <BlurFade className="relative hidden justify-center lg:flex" delay={0.2} direction="none">
            <Globe
              accentColor="oklch(0.62 0.19 259)"
              arcs={LINES}
              center={[35, -15]}
              className="w-full max-w-[min(100%,30rem)]"
              label="Globe with animated lines around the world"
              samples={20000}
              speed={0}
            />
          </BlurFade>
        </div>
      </section>
    </div>
  );
}
