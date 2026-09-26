import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_X, PAGE_X_BLEED } from "@/lib/page-x";

/** Homepage loading fallback. The hero block is full-bleed (PAGE_X_BLEED,
 * same as the real HeroSection/HeroCinematic wrapper in page.tsx) — it used
 * to sit inside the normal padded container, so the real hero snapping to
 * full width the moment data arrived read as a layout jump rather than a
 * skeleton resolving into content. The sections below loosely mirror the
 * real homepage's shape (How this started, a 3-up testimonials/notices
 * grid, an FAQ list) rather than two generic cards. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-10">
      <div className={`relative -mt-6 -mb-6 ${PAGE_X_BLEED}`}>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Skeleton className="h-3 w-56 max-w-full" />
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>

      <div className={`flex flex-col gap-10 ${PAGE_X}`}>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-56 max-w-full" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-2/3 max-w-md" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div className="flex flex-col gap-2 rounded-lg border p-4" key={i}>
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton className="h-12 w-full rounded-lg" key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
