import { Apple, MapPin, Mountain, Play, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroCopy } from "@/components/hero-copy";
import { DecorIcon } from "@/components/decor-icon";

type WalkApp = {
  name: string;
  description: string;
  icon: LucideIcon;
  appStore: string;
  googlePlay: string;
};

const WALK_APPS: WalkApp[] = [
  {
    name: "what3words",
    description:
      "Find the exact meeting point. Every walk's what3words address opens straight in the app, so you know precisely where to be.",
    icon: MapPin,
    appStore: "https://apps.apple.com/gb/app/what3words-navigation-maps/id657878530",
    googlePlay: "https://play.google.com/store/apps/details?id=com.what3words.android",
  },
  {
    name: "HiiKER",
    description: "Hiking maps for the routes we walk — see the trail, the distance and the hills before you set off.",
    icon: Mountain,
    appStore: "https://apps.apple.com/gb/app/hiiker-the-hiking-maps-app/id1470810597",
    googlePlay: "https://play.google.com/store/apps/details?id=com.waymarkedtrails.hiiker",
  },
];

/**
 * The Walking apps page (/apps, linked from the footer and the phone
 * menu's More): the two free apps the group uses, each with App Store and
 * Google Play links.
 */
export function WalkAppsSection() {
  return (
    <section>
      <HeroCopy eyebrow={null} title="Apps for our walks" titleAs="h1">
        <p>Two free apps that make walking with us easier. Download them before your first walk.</p>
      </HeroCopy>
      <div className="relative w-full">
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />
        <div className="grid w-full grid-cols-1 gap-px border-t bg-border sm:grid-cols-2">
          {WALK_APPS.map((app) => (
            <div className="flex flex-col gap-5 bg-background p-6 md:p-8" key={app.name}>
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border">
                  <app.icon aria-hidden className="size-5" />
                </span>
                <h3 className="text-lg font-medium text-foreground">{app.name}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{app.description}</p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <a aria-label={`Get ${app.name} on the App Store`} href={app.appStore} rel="noopener noreferrer" target="_blank">
                    <Apple data-icon="inline-start" />
                    App Store
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
