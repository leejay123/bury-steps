import { CalendarDays, Clock, MapPin, Timer } from "lucide-react";
import { BeforeYouSetOff } from "@/components/before-you-set-off";
import { EmptyStateSkeleton, SkLine } from "@/components/list-skeletons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ForecastSkeleton } from "@/components/walk-forecast";
import { WalkMapSkeleton } from "@/components/walk-map-skeleton";
import type { SiteTheme } from "@/lib/site-theme";
import { MAX_JOURNEY_EVENTS } from "@/lib/walk-journey";

/**
 * Placeholders for a walk's page, section by section, shaped like the real
 * ones and in the order chosen in Settings (walkPageSections). Labels,
 * headings and fixed wording are the real thing; grey only stands in for
 * the walk's own details; buttons are empty space of the same size.
 */

const FACTS = [
  { icon: CalendarDays, label: "Date", width: "w-20" },
  { icon: Clock, label: "Start time", width: "w-12" },
  { icon: Timer, label: "Expected length", width: "w-32" },
  { icon: MapPin, label: "Meeting point", width: "w-40" },
];

/** WalkFacts: the four usual tiles, real labels, grey values. */
function WalkFactsSkeleton() {
  return (
    <div className="@container flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-2 @lg:grid-cols-3 @3xl:grid-cols-4">
        {FACTS.map(({ icon: Icon, label, width }) => (
          <div className="flex min-w-0 flex-col gap-1 rounded-lg bg-muted/60 px-3 py-2.5" key={label}>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon aria-hidden="true" className="size-3.5 shrink-0" />
              {label}
            </dt>
            <dd className="flex h-5 items-center">
              <Skeleton className={`h-[64%] max-w-full rounded-[4px] ${width}`} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** WalkDescription: six lines (it clamps to six) and the Read more space. */
function WalkDescriptionSkeleton() {
  const widths = ["w-1/2", "w-2/5", "w-1/3", "w-full", "w-11/12", "w-1/4"];
  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed">
      <div>
        {widths.map((width, i) => (
          <div className="flex h-[1.421875rem] items-center" key={i}>
            <Skeleton className={`h-[56%] rounded-[4px] ${width}`} />
          </div>
        ))}
      </div>
      <span aria-hidden className="invisible h-5 w-24" />
    </div>
  );
}

/** The title card: walk name, status label, (organisers) Created by, facts, description. */
export function WalkDetailsCardSkeleton({ organiser }: { organiser: boolean }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        {organiser ? (
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <div className="flex w-full min-w-0 items-center justify-between gap-4">
              <div className="flex h-6 w-2/3 max-w-sm items-center">
                <Skeleton className="h-[80%] w-full rounded-[4px]" />
              </div>
              <Skeleton className="h-6 w-24 rounded-md max-sm:hidden" />
            </div>
            <SkLine className="w-44" size="xs" />
            <Skeleton className="mt-1 h-7 w-full rounded-md sm:hidden" />
          </div>
        ) : (
          <div className="flex w-full min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex h-5 w-2/3 max-w-sm items-center">
              <Skeleton className="h-[80%] w-full rounded-[4px]" />
            </div>
            <Skeleton className="h-6 w-24 rounded-md max-sm:h-7 max-sm:w-full" />
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <WalkFactsSkeleton />
        <WalkDescriptionSkeleton />
        {organiser ? null : <span aria-hidden className="invisible block h-8 w-32" />}
      </CardContent>
    </Card>
  );
}

/** What3wordsLink: real label and small print, grey words. */
export function PreciseLocationSkeleton() {
  return (
    <div className="flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm">
      <MapPin className="size-5 shrink-0 text-muted-foreground" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Precise location</span>
        <span className="flex h-5 items-center">
          <Skeleton className="h-[64%] w-40 rounded-[4px]" />
        </span>
        <span className="text-xs text-muted-foreground">
          A what3words address — three fixed words that mark this exact spot to within 3 metres.
          Tap to open it in Maps.
        </span>
      </span>
    </div>
  );
}

/** The shared sections, in the chosen order. Before you set off is members-only. */
export function WalkSectionsSkeleton({ theme, organiser }: { theme: SiteTheme; organiser: boolean }) {
  return (
    <>
      {theme.walkPageSections.map(({ id, visible }) => {
        if (!visible) return null;
        switch (id) {
          case "before":
            return organiser || !theme.beforeYouSetOffEnabled ? null : (
              <BeforeYouSetOff key={id} tips={theme.beforeYouSetOffTips} />
            );
          case "map":
            return <WalkMapSkeleton key={id} />;
          case "forecast":
            return <ForecastSkeleton key={id} place={null} />;
          case "precise":
            return <PreciseLocationSkeleton key={id} />;
        }
      })}
    </>
  );
}

/** The organiser page's own parts after the shared sections: buttons, who's on the walk, Journey. */
export function OrganiserWalkToolsSkeleton() {
  return (
    <>
      {/* The walk's buttons (Add to calendar, Edit…): their row, left empty. */}
      <div aria-hidden className="h-8" />
      <Separator />
      <EmptyStateSkeleton />
      <Separator />
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">Journey</h2>
          <p className="text-sm text-muted-foreground">
            Short moments from the walk. View journey opens the timeline in a drawer — the same one
            members see. Up to {MAX_JOURNEY_EVENTS}.
          </p>
        </div>
        <EmptyStateSkeleton />
      </section>
    </>
  );
}
