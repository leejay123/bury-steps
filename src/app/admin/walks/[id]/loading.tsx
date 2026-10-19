import Link from "next/link";
import { SkLine } from "@/components/list-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { WalkPageColumns } from "@/components/walk-page-columns";
import {
  OrganiserWalkToolsSkeleton,
  WalkButtonsSkeleton,
  WalkDetailsCardSkeleton,
  WalkSectionsSkeleton,
  WalkHeadlineSkeleton,
  WalkTabsSkeleton,
} from "@/components/walk-page-skeletons";
import { isWalkGalleryLayout, isWalkIdeaLayout, isWalkStudioLayout, isWalkTabsVariant } from "@/lib/walk-page-sections";
import { getSiteTheme } from "@/lib/site-theme";
import { getWalkDesigns, getWalkPageChoice } from "@/lib/walk-page-choice";
import { DesignSkeleton } from "@/components/walk-designer/design-skeleton";

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
  const [theme, choice, designs] = await Promise.all([getSiteTheme(), getWalkPageChoice(), getWalkDesigns()]);
  // A designed page: the placeholder follows the organisers' design (its own
  // back link, title box, facts and tab names), not the standard tabs.
  if (choice.layout === "designed" && designs.organiser)
    return (
      <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6 px-4 py-6 md:px-6">
        <DesignSkeleton design={designs.organiser} />
      </div>
    );
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <Link className="text-sm text-muted-foreground hover:text-foreground" href="/admin/walks">
        &larr; All walks
      </Link>

      {isWalkTabsVariant(choice.layout) ||
    isWalkIdeaLayout(choice.layout) ||
    isWalkGalleryLayout(choice.layout) ||
    isWalkStudioLayout(choice.layout) ||
    choice.layout === "designed" ? (
        // A to D, the one-column layouts with tabs: the title line, then the
        // tabs with Overview's details.
        <>
          <WalkHeadlineSkeleton />
          <WalkTabsSkeleton
            labels={[
              { text: "Overview" },
              { text: "Map & weather" },
              { text: "Attended", count: true },
              { text: "Journey" },
            ]}
          >
            <WalkDetailsCardSkeleton organiser />
          </WalkTabsSkeleton>
        </>
      ) : choice.layout === "columns" ? (
        // The two-column layout (Settings → Walk page cards → Layout).
        <WalkPageColumns
          aside={
            <>
              <ClockInBoxSkeleton />
              <ShareLinkSkeleton />
              <WalkButtonsSkeleton />
            </>
          }
          tabs={[
            {
              value: "route",
              label: "Map & weather",
              content: (
                <WalkTabsSkeleton
                  labels={[{ text: "Map & weather" }, { text: "Attended", count: true }, { text: "Journey" }]}
                >
                  <WalkSectionsSkeleton organiser theme={theme} />
                </WalkTabsSkeleton>
              ),
            },
          ]}
          top={<WalkDetailsCardSkeleton organiser />}
        />
      ) : (
        <>
          <WalkDetailsCardSkeleton organiser />
          <ClockInBoxSkeleton />
          <ShareLinkSkeleton />
          <WalkSectionsSkeleton organiser theme={theme} />
          <OrganiserWalkToolsSkeleton />
        </>
      )}
    </div>
  );
}

/** The clock-in box ("Clock-in is not open yet…", or the clock-in
 * button): an info-box shape, title and two lines. */
function ClockInBoxSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-1 rounded-lg border px-4 py-3">
      <SkLine className="w-44" size="sm" />
      <SkLine className="w-full max-w-2xl" size="sm" />
      <SkLine className="w-2/3 max-w-xl" size="sm" />
    </div>
  );
}

/** The share link, and the Copy button's space. */
function ShareLinkSkeleton() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex min-h-8 min-w-0 flex-1 items-center rounded-md bg-muted px-3 py-1.5">
        <Skeleton className="h-3.5 w-72 max-w-full rounded-lg bg-background/70" />
      </div>
      <Skeleton className="h-8 w-full rounded-md sm:w-26 sm:shrink-0" />
    </div>
  );
}
