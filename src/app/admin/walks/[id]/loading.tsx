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
 * it's fixed, grey where the walk's own details and buttons go — no gaps.
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

      {/* The clock-in box ("Clock-in is not open yet…", or the clock-in
          form): an info-box shape, title and two lines. */}
      <div aria-hidden className="flex flex-col gap-1 rounded-lg border px-4 py-3">
        <SkLine className="w-44" size="sm" />
        <SkLine className="w-full max-w-2xl" size="sm" />
        <SkLine className="w-2/3 max-w-xl" size="sm" />
      </div>

      {/* The share link, and the Copy button's space. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex min-h-8 min-w-0 flex-1 items-center rounded-md bg-muted px-3 py-1.5">
          <Skeleton className="h-3.5 w-72 max-w-full rounded-[4px] bg-background/70" />
        </div>
        <Skeleton className="h-8 w-full rounded-md sm:w-26 sm:shrink-0" />
      </div>

      <WalkSectionsSkeleton organiser theme={theme} />

      <OrganiserWalkToolsSkeleton />
    </div>
  );
}
