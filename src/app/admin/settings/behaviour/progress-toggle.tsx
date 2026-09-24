"use client";

import { updateProgressEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { SettingsSwitchSection } from "../settings-page";

export function ProgressToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateProgressEnabled,
    enabled,
    formKey: "progressEnabled",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="How we walk together this month — clock-ins, not miles or speed. Turning this off removes the page for everyone, organisers included."
      id="progress-enabled"
      onCheckedChange={toggle}
      pending={isPending}
      title="Show the Progress page"
    />
  );
}
