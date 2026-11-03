import { HistoryFilterChrome } from "@/components/list-chrome";
import { MembersBackLink } from "./members-back-link";
import { PageTop } from "@/components/page-top";
import { HistoryRowsSkeleton, SkButtonSpace, SkLine } from "@/components/list-skeletons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Grey shapes where the page top's words go (spans: they sit inside its heading and line). */
function Line({ className }: { className: string }) {
  return <span className={`inline-block animate-pulse rounded-md bg-accent align-middle ${className}`} />;
}

/** Same card as the loaded stat: only the number is still loading. */
function StatCardSkeleton({ label }: { label: string }) {
  return (
    <Card className="gap-1 py-4">
      <CardHeader className="gap-0 px-4">
        <SkLine className="w-8" size="lg" />
        <CardDescription>{label}</CardDescription>
      </CardHeader>
    </Card>
  );
}

/**
 * A member's page (page.tsx) while it loads, part for part: the page top (name,
 * email, joined date), the card (photo, role, buttons), the emergency contact
 * card, the stat cards, then their walk history. Fixed wording is real;
 * their own details and buttons are grey — no gaps. The way back lives in
 * the top bar in the shadcn.io design.
 */
export function MemberDetailSkeleton() {
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6 px-4 py-6 md:px-6" data-edge-sections="">
      <MembersBackLink />
      {/* The same animated page top: the name, email and joined date still loading. */}
      <PageTop
        className="flex flex-col gap-3"
        eyebrow="Member"
        intro={
          <>
            <Line className="h-5 w-56 max-w-full" />
            <br />
            <Line className="h-5 w-72 max-w-full" />
          </>
        }
        title={<Line className="h-10 w-64 max-w-full" />}
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            {/* The role badge (name, email and joined date are in the page top). */}
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
          {/* "Log in as" and the ⋯ menu. */}
          <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
            <SkButtonSpace className="w-24" />
            <SkButtonSpace className="w-8" />
          </div>
        </CardHeader>
      </Card>

      <Card className="gap-3">
        <CardHeader className="gap-1">
          <CardTitle className="text-base">Emergency contact</CardTitle>
          <CardDescription>
            Only organisers can see this. The member adds it when they clock in, and it stays on
            their account until they change it or the account is removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <SkLine className="w-56" size="sm" />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2" data-edge-stats="">
        <StatCardSkeleton label="Total walks" />
        <StatCardSkeleton label="Cancelled after clock-in" />
      </div>

      {/* As the history list: search and filters, the year, then exactly
          as many rows as they have (saved when you clicked them in the
          list); with none, the empty box's shape, and no filters. */}
      <div className="flex flex-col gap-6 [&:has([data-reveal-list][hidden])>[data-sk-filters]]:hidden" data-edge-history="">
        <div className="contents" data-sk-filters="">
          <HistoryFilterChrome />
        </div>
        <section className="flex flex-col gap-3">
          <HistoryRowsSkeleton remember="member-detail" />
        </section>
      </div>
    </div>
  );
}
