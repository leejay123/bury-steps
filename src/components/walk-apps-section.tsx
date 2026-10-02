import { Apple, Check, MapPin, Mountain, Play, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroCopy } from "@/components/hero-copy";
import { DecorIcon } from "@/components/decor-icon";

type WalkApp = {
  name: string;
  tagline: string;
  description: string;
  uses: string[];
  icon: LucideIcon;
  appStore: string;
  googlePlay: string;
};

const WALK_APPS: WalkApp[] = [
  {
    name: "what3words",
    tagline: "Find the exact meeting point",
    description:
      "Every walk's what3words address opens straight in the app, so you know precisely where to be — even in a car park or at a field gate.",
    uses: [
      "Tap the what3words address on a walk page",
      "Get walking or driving directions to the spot",
      "Share your exact location if you need help on a walk",
    ],
    icon: MapPin,
    appStore: "https://apps.apple.com/gb/app/what3words-navigation-maps/id657878530",
    googlePlay: "https://play.google.com/store/apps/details?id=com.what3words.android",
  },
  {
    name: "HiiKER",
    tagline: "Hiking maps for our routes",
    description:
      "See the trail, the distance and the hills before you set off, and follow the route on the day so you never lose the group.",
    uses: [
      "Look at the route and the climbs before the walk",
      "Follow the path on your phone as you walk",
      "See where you are on the map using your phone's GPS",
    ],
    icon: Mountain,
    appStore: "https://apps.apple.com/gb/app/hiiker-the-hiking-maps-app/id1470810597",
    googlePlay: "https://play.google.com/store/apps/details?id=com.waymarkedtrails.hiiker",
  },
];

/**
 * The Walking apps page (/apps, linked from the footer and the phone
 * menu's More): the two free apps the group uses, each with what it's for
 * and App Store / Google Play links.
 */
export function WalkAppsSection() {
  return (
    <section>
      <HeroCopy eyebrow="Free to download" title="Apps for our walks" titleAs="h1">
        <p>Two free apps that make walking with us easier. Download them before your first walk.</p>
      </HeroCopy>
      <div className="relative w-full">
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />
        <div className="grid w-full grid-cols-1 gap-px border-t bg-border md:grid-cols-2">
          {WALK_APPS.map((app) => (
            <article className="flex flex-col gap-6 bg-background p-6 sm:p-8 lg:p-10" key={app.name}>
              <div className="flex items-center gap-4">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border bg-muted/40">
                  <app.icon aria-hidden className="size-8" />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">{app.name}</h2>
                  <p className="text-sm font-medium text-muted-foreground">{app.tagline}</p>
                </div>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground">{app.description}</p>
              <ul className="flex flex-col gap-2.5">
                {app.uses.map((use) => (
                  <li className="flex items-start gap-2.5 text-base text-foreground" key={use}>
                    <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                    {use}
                  </li>
                ))}
              </ul>
              <div className="mt-auto grid gap-3 pt-2 sm:grid-cols-2">
                <Button asChild size="lg">
                  <a aria-label={`Get ${app.name} on the App Store`} href={app.appStore} rel="noopener noreferrer" target="_blank">
                    <Apple data-icon="inline-start" />
                    App Store
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a
                    aria-label={`Get ${app.name} on Google Play`}
                    href={app.googlePlay}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Play data-icon="inline-start" />
                    Google Play
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
