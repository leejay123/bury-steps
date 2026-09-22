import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic skeleton for any page under Settings while its data loads — the
 * persistent sidebar (SettingsSidebar) renders instantly since it's static,
 * so this only needs to stand in for a page's own title/description and
 * one content card.
 */
export default function Loading() {
  return (
    <div className="flex flex-col">
      <div className="relative border-b px-4 py-6 md:px-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <div className="px-4 py-6 md:px-6">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
