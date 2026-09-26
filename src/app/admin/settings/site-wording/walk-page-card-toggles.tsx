"use client";

import { updateBeforeYouSetOffEnabled, updateHowWalksWorkEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { SettingsSwitchSection } from "../settings-page";

export function BeforeYouSetOffToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateBeforeYouSetOffEnabled,
    enabled,
    formKey: "beforeYouSetOffEnabled",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="Shown while someone is waiting for clock-in to open. Turning this off hides the card on every walk."
      id="before-you-set-off-enabled"
      onCheckedChange={toggle}
      pending={isPending}
      title="Show Before you set off"
    />
  );
}

export function HowWalksWorkToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateHowWalksWorkEnabled,
    enabled,
    formKey: "howWalksWorkEnabled",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="Sits directly under the walk details. Turning this off hides the card on every walk."
      id="how-this-group-works-enabled"
      onCheckedChange={toggle}
      pending={isPending}
      title="Show How this group works"
    />
  );
}
