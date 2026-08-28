"use client";

import { updateCarouselEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function CarouselToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateCarouselEnabled,
    enabled,
    formKey: "carouselEnabled",
  });

  return (
    <div className="flex items-start gap-3 rounded-xl border p-4">
      <Checkbox
        checked={on}
        disabled={isPending}
        id="carousel-enabled"
        onCheckedChange={(value) => toggle(value === true)}
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Label htmlFor="carousel-enabled">Show carousel on the homepage</Label>
          {isPending ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Turn this off to hide the photo slider completely. You can still keep photos here for later.
        </p>
      </div>
    </div>
  );
}
