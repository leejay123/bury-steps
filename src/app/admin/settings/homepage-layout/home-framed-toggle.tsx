"use client";

import { updateHomeFramed } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { SettingsSwitchSection } from "../settings-page";

export function HomeFramedToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateHomeFramed,
    enabled,
    formKey: "homeFramed",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="In the style of shadcn.io: each section's heading and intro on the left with its button on the right (stacked on phones), and small + marks where the section lines meet the page frame. The hero stays centred. Off keeps the centred headings."
      id="home-framed"
      onCheckedChange={toggle}
      pending={isPending}
      title="Framed sections (shadcn.io style)"
    />
  );
}
