import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { BeforeYouSetOff } from "@/components/before-you-set-off";
import { WalkPageColumns } from "@/components/walk-page-columns";
import {
  WalkDetailsCardSkeleton,
  WalkHeadlineSkeleton,
  WalkSectionsSkeleton,
  WalkTabsSkeleton,
} from "@/components/walk-page-skeletons";
import { isWalkGalleryLayout, isWalkIdeaLayout, isWalkStudioLayout, isWalkTabsVariant } from "@/lib/walk-page-sections";
import { getSiteTheme } from "@/lib/site-theme";
import { getWalkDesigns, getWalkPageChoice } from "@/lib/walk-page-choice";
import { DesignSkeleton } from "@/components/walk-designer/design-skeleton";

/**
 * Shaped like the walk page itself (page.tsx): the back link and journey
 * button's space, the title card (four fact tiles, description, calendar
 * button's space), then the shared sections in the order chosen in
 * Settings. Real wording where it's fixed, grey where the walk's own
 * details go.
 */
export default function Loading() {
  return <WalkLinkLoading />;
}

export async function WalkLinkLoading() {
  const [theme, choice, designs] = await Promise.all([getSiteTheme(), getWalkPageChoice(), getWalkDesigns()]);
  // A designed page: the placeholder follows the members' or visitors'
  // design (shown by the same switch as ← Walks / ← Home), not the standard tabs.
  const memberDesign = designs.member ?? designs.visitor;
  const visitorDesign = designs.visitor ?? designs.member;
  if (choice.layout === "designed" && memberDesign && visitorDesign)
    return (
      <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6">
        <span className="text-sm text-muted-foreground">
          <Link className="hover:text-foreground" data-member-home="" href="/walks">
            ← Walks
          </Link>
          <Link className="hover:text-foreground" data-guest-home="" href="/">
            ← Home
          </Link>
        </span>
        <div data-member-home="">
          <DesignSkeleton design={memberDesign} />
        </div>
        <div data-guest-home="">
          <DesignSkeleton design={visitorDesign} />
        </div>
      </div>
    );
  if (isWalkTabsVariant(choice.layout) ||
    isWalkIdeaLayout(choice.layout) ||
    isWalkGalleryLayout(choice.layout) ||
    isWalkStudioLayout(choice.layout) ||
    choice.layout === "designed") {
    // A to D, the one-column layouts with tabs.
    return (
      <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6">
        <span className="text-sm text-muted-foreground">
          <Link className="hover:text-foreground" data-member-home="" href="/walks">
            ← Walks
          </Link>
          <Link className="hover:text-foreground" data-guest-home="" href="/">
            ← Home
          </Link>
        </span>
        <WalkHeadlineSkeleton />
        <WalkTabsSkeleton labels={[{ text: "Overview" }, { text: "Map & weather" }]}>
          <WalkDetailsCardSkeleton organiser={false} />
        </WalkTabsSkeleton>
      </div>
    );
  }
  if (choice.layout === "columns") {
    // The two-column layout (Settings → Walk page cards → Layout): the
    // details card, the sections under it, and Before you set off in the
    // right-hand column (the clock-in part arrives with the page).
    const before = theme.walkPageSections.some(({ id, visible }) => id === "before" && visible);
    return (
      <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6">
        <span className="text-sm text-muted-foreground">
          <Link className="hover:text-foreground" data-member-home="" href="/walks">
            ← Walks
          </Link>
          <Link className="hover:text-foreground" data-guest-home="" href="/">
            ← Home
          </Link>
        </span>
        <WalkPageColumns
          aside={before && theme.beforeYouSetOffEnabled ? <BeforeYouSetOff tips={theme.beforeYouSetOffTips} /> : null}
          tabs={[
            {
              value: "route",
              label: "Map & weather",
              content: <WalkSectionsSkeleton organiser={false} theme={theme} withoutBefore />,
            },
          ]}
          top={<WalkDetailsCardSkeleton organiser={false} />}
        />
      </div>
    );
  }
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6">
      {/* The real back link (members go back to Walks, everyone else Home —
          last visit decides, like the hero buttons), and the journey
          button as a grey shape of its size. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          <Link className="hover:text-foreground" data-member-home="" href="/walks">
            ← Walks
          </Link>
          <Link className="hover:text-foreground" data-guest-home="" href="/">
            ← Home
          </Link>
        </span>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <WalkDetailsCardSkeleton organiser={false} />

      <WalkSectionsSkeleton organiser={false} theme={theme} />
    </div>
  );
}
