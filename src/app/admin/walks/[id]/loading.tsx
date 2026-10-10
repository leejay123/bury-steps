import Link from "next/link";
import { SkLine } from "@/components/list-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  OrganiserWalkToolsSkeleton,
  WalkDetailsCardSkeleton,
  WalkSectionsSkeleton,
} from "@/components/walk-page-skeletons";
import { getSiteTheme } from "@/lib/site-theme";

/**
 * Shaped like the organiser's walk page (page.tsx), part for part: the back
 * link, the title card (four fact tiles, description), the clock-in line,
 * the share link, then the shared sections in the order chosen in Settings,
 * the buttons' row, who's on the walk and the Journey. Real wording where
 * it's fixed, grey where the walk's own details go, empty space for buttons.
 */
export default function WalkDetailLoading() {
  return <OrganiserWalkLoading />;
}

async function OrganiserWalkLoading() {
  const theme = await getSiteTheme();
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <Link className="text-sm text-muted-foreground hover:text-foreground" href="/admin/walks">
        &larr; All walks
      </Link>

      <WalkDetailsCardSkeleton organiser />

      {/* "Clock-in opens an hour before the start…" — depends on the walk's time. */}
      <SkLine className="w-96 max-w-full" size="sm" />

      {/* The share link, and the Copy button's space. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex min-h-8 min-w-0 flex-1 items-center rounded-md bg-muted px-3 py-1.5">
          <Skeleton className="h-3.5 w-72 max-w-full rounded-[4px] bg-background/70" />
        </div>
        <span aria-hidden className="invisible h-8 w-full sm:w-26 sm:shrink-0" />
      </div>

      <WalkSectionsSkeleton organiser theme={theme} />

      <OrganiserWalkToolsSkeleton />
    </div>
  );
}
