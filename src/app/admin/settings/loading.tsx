import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic skeleton for any page under Settings while its data loads —
 * same width and shape as SettingsPage: back link, title, intro, then one
 * content card. Full width, matching SettingsPage's own SETTINGS_WIDTH.
 */
export default function Loading() {
  return (
    <div className="flex flex-col">
      <div className="border-b px-4 py-6 md:px-6">
        <div className="flex w-full flex-col gap-4">
          <Skeleton className="h-4 w-28" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </div>
      </div>
      <div className="px-4 py-6 md:px-6">
        <div className="flex w-full flex-col gap-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
