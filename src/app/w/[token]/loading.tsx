import Link from "next/link";
import { WalkDetailsCardSkeleton, WalkSectionsSkeleton } from "@/components/walk-page-skeletons";
import { getSiteTheme } from "@/lib/site-theme";

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

async function WalkLinkLoading() {
  const theme = await getSiteTheme();
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6">
      {/* The real back link (members go back to Walks, everyone else Home —
          last visit decides, like the hero buttons), and the journey
          button's space left empty: links and buttons are never grey. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          <Link className="hover:text-foreground" data-member-home="" href="/walks">
            ← Walks
          </Link>
          <Link className="hover:text-foreground" data-guest-home="" href="/">
            ← Home
          </Link>
        </span>
        <span aria-hidden className="invisible h-9 w-32" />
      </div>

      <WalkDetailsCardSkeleton organiser={false} />

      <WalkSectionsSkeleton organiser={false} theme={theme} />
    </div>
  );
}
