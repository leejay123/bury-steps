import Link from "next/link";
import { HistoryFilterChrome } from "@/components/list-chrome";
import { HistoryRowsSkeleton, SkButtonSpace, SkLine } from "@/components/list-skeletons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
 * A member's page (page.tsx) while it loads, part for part: the back link,
 * the name card (photo, name, role, email, joined date, buttons), the
 * emergency contact card, the stat cards, then their walk history. Fixed
 * wording is real; their own details and buttons are grey — no gaps.
 */
export function MemberDetailSkeleton() {
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <Link className="text-sm text-muted-foreground hover:text-foreground" href="/admin/members">
        &larr; All members
      </Link>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Name (text-2xl, leading-none) and the role badge. */}
                <Skeleton className="h-6 w-40 rounded-[4px]" />
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
              <div className="flex flex-col gap-1">
                <SkLine className="w-48" size="sm" />
                <SkLine className="w-64 max-w-full" size="sm" />
              </div>
            </div>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCardSkeleton label="Total walks" />
        <StatCardSkeleton label="Cancelled after clock-in" />
      </div>

      <section className="flex flex-col gap-3">
        {/* "12 walks" */}
        <SkLine className="w-16" size="sm" />
        {/* As the history list: search and filters, the year, then exactly
            as many rows as they have (saved when you clicked them in the
            list); with none, the empty box's shape, and no filters. */}
        <div className="flex flex-col gap-6 [&:has([data-reveal-list][hidden])>[data-sk-filters]]:hidden">
          <div className="contents" data-sk-filters="">
            <HistoryFilterChrome />
          </div>
          <section className="flex flex-col gap-3">
            <div className="[section:has([data-reveal-list][hidden])>&]:hidden">
              <SkLine className="w-12" size="sm" />
            </div>
            <HistoryRowsSkeleton remember="member-detail" />
          </section>
        </div>
      </section>
    </div>
  );
}
