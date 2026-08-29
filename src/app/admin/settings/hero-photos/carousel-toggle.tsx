"use client";

import { updateCarouselEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "../settings-page";

export function CarouselToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateCarouselEnabled,
    enabled,
    formKey: "carouselEnabled",
  });

  return (
    <SettingsSection
      description="Hide the slider on the homepage without deleting your photos."
      title="Carousel"
    >
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Label className="font-medium" htmlFor="carousel-enabled">
            Show on the homepage
          </Label>
          {isPending ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
        </div>
        <Checkbox
          checked={on}
          disabled={isPending}
          id="carousel-enabled"
          onCheckedChange={(value) => toggle(value === true)}
        />
      </div>
    </SettingsSection>
  );
}
