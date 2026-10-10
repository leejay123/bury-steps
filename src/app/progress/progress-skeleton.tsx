import { NameRowsSkeleton, SkLine, SkText } from "@/components/list-skeletons";
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
          <Skeleton className="h-5 w-16 rounded-md" key={i} />
        ))}
      </div>
    </section>
  );
}

function TogetherSkeleton({ body }: { body: string }) {
  if (!body) return null;
  return (
    <section className="flex flex-col gap-3 rounded-xl border p-4" data-reveal-card="">
      <h2 className="font-medium">Together</h2>
      <p className="text-sm">
        <SkText text={body} />
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <Skeleton className="h-full w-1/2 rounded-full" />
      </div>
    </section>
  );
}

function CupSkeleton({ title, body }: { title: string; body: string }) {
  if (!title || !body) return null;
  return (
    <section className="flex flex-col gap-1.5 rounded-xl border p-4" data-reveal-card="">
      <h2 className="font-medium">
        <SkText text={title} />
      </h2>
      <p className="text-sm">
        <SkText text={body} />
      </p>
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
  togetherBody = "",
  cupTitle = "",
  cupBody = "",
}: {
  rows: number;
  badges?: number;
  togetherBody?: string;
  cupTitle?: string;
  cupBody?: string;
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
      <TogetherSkeleton body={togetherBody} />
      <CupSkeleton body={cupBody} title={cupTitle} />

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
