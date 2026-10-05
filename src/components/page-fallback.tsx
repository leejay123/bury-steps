import { Skeleton } from "@/components/ui/skeleton";

/** A simple stand-in for a page that depends on the link it was opened
 * from (an email link's code) — shown for an instant while it loads. */
export function PageFallback() {
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-4">
      <Skeleton className="h-7 w-56 max-w-full" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
