import { PageTop } from "@/components/page-top";
import { Skeleton } from "@/components/ui/skeleton";

/** Grey shapes where the notice's words go (spans: they sit inside the page top's heading and line). */
function Line({ className }: { className: string }) {
  return <span className={`inline-block animate-pulse rounded-md bg-accent align-middle ${className}`} />;
}

export default function Loading() {
  return (
    <article data-page-loading=""
      aria-busy="true"
      aria-label="Loading notice"
      className="flex w-full flex-col gap-6"
      data-edge-sections=""
    >
      {/* The same animated page top the notice opens with. */}
      <PageTop
        className="flex flex-col gap-3"
        eyebrow="Notice"
        intro={<Line className="h-5 w-80 max-w-full" />}
        title={<Line className="h-10 w-72 max-w-full" />}
      />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </article>
  );
}
