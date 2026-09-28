import { Skeleton } from "@/components/ui/skeleton";

/** Same shape as the email preferences page: heading and email, a bordered list of options, Save. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col divide-y rounded-xl border">
          {Array.from({ length: 4 }, (_, row) => (
            <div className="flex items-start gap-3 px-4 py-3.5" key={row}>
              <Skeleton className="mt-0.5 size-4 rounded-sm" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3.5 w-56 max-w-full" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  );
}
