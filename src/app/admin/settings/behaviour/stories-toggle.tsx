"use client";

import { updateStoriesEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { SettingsSwitchSection } from "../settings-page";

export function StoriesToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateStoriesEnabled,
    enabled,
    formKey: "storiesEnabled",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="The row of 24-hour photo stories on the walks page. Turning this off hides it for everyone and stops new stories being posted; stories already posted still disappear after 24 hours."
      id="stories-enabled"
      onCheckedChange={toggle}
      pending={isPending}
      title="Show stories"
    />
  );
}
