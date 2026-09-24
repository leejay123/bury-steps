"use client";

import { updateCarouselEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { SettingsSwitchSection } from "../settings-page";

export function CarouselToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateCarouselEnabled,
    enabled,
    formKey: "carouselEnabled",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="The rotating photos at the top of the homepage. Turning this off hides them without deleting any."
      id="carousel-enabled"
      onCheckedChange={toggle}
      pending={isPending}
      title="Show the photo carousel"
    />
  );
}
