import { NameRowsSkeleton, SkLine } from "@/components/list-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** Same cell as the loaded stat: the number is the only part still loading. */
function StatSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1 border-b p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <SkLine className="w-8" size="lg" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function BadgeSkeleton({ count }: { count: number }) {
  if (count < 1) return null;
  return (
    <section className="flex flex-col gap-3" data-reveal-card="">
      <h2 className="text-sm font-medium text-muted-foreground">Your badges</h2>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: count }, (_, i) => (
          <Skeleton className="h-6 w-24 rounded-full" key={i} />
        ))}
      </div>
    </section>
  );
}

function TogetherSkeleton() {
  return (
    <section className="flex flex-col gap-3 rounded-xl border p-4" data-reveal-card="">
      <SkLine className="w-24" />
      <SkLine className="w-full" size="sm" />
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <Skeleton className="h-full w-1/2 rounded-full" />
      </div>
    </section>
  );
}

function CupSkeleton() {
  return (
    <section className="flex flex-col gap-1.5 rounded-xl border p-4" data-reveal-card="">
      <SkLine className="w-32" />
      <SkLine className="w-full" size="sm" />
      <SkLine className="w-4/5" size="sm" />
    </section>
  );
}

/**
 * The stats card is on screen immediately, at the same size as the loaded
 * card, so the page does not jump. Grey stands in for the numbers only.
 * Together, the cup and badges keep the frame they had last time, and fade
 * in the same way as the Walks table. The name list uses that frame too.
 */
export function ProgressSkeleton({
  rows,
  badges = 0,
  together = false,
  cup = false,
}: {
  rows: number;
  badges?: number;
  together?: boolean;
  cup?: boolean;
}) {
  return (
    <>
      <section className="overflow-hidden rounded-xl border" data-reveal-card="">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          <StatSkeleton label="This month" />
          <StatSkeleton label="This year" />
          <StatSkeleton label="Weeks in a row" />
        </div>
      </section>

      <BadgeSkeleton count={badges} />
      {together ? <TogetherSkeleton /> : null}
      {cup ? <CupSkeleton /> : null}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">This month</h2>
          <p className="text-sm text-muted-foreground">
            Everyone who has clocked in to a finished walk this month, grouped by how many. People
            with the same count sit together — a draw, not a place. People with none are not listed.
          </p>
        </div>
        <NameRowsSkeleton rows={rows} />
      </section>
    </>
  );
}
