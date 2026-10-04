import { NameRowsSkeleton } from "@/components/list-skeletons";

/**
 * The name list only. Stats, badges and the cup are cards — they stay out
 * of the placeholder so a refresh doesn't draw columns where the names go.
 */
export function ProgressSkeleton({ rows }: { rows: number }) {
  return (
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
  );
}
