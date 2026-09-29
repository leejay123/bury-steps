"use client";

import { updateTitleRevealEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { SettingsSwitchSection } from "../settings-page";

export function TitleRevealToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateTitleRevealEnabled,
    enabled,
    formKey: "titleRevealEnabled",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="Homepage section titles (How this started, From the group, Latest notices, FAQs) fade in word by word as you scroll to them. Off shows them straight away."
      id="title-reveal-enabled"
      onCheckedChange={toggle}
      pending={isPending}
      title="Animate section titles"
    />
  );
}
