import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <ul className="flex flex-col overflow-hidden rounded-xl border bg-card">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <li className="flex items-center justify-between gap-3 border-b p-3 last:border-0" key={i}>
            <div className="flex min-w-0 flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3.5 w-44 max-w-full" />
            </div>
            <Skeleton className="h-5 w-16 shrink-0 rounded-md" />
          </li>
        ))}
      </ul>
    </div>
  );
}
