"use client";

import { updateAnnouncementBanner } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { SettingsSwitchSection } from "../settings-page";

/** Homepage top strip ("New here? Come for a walk…") — on by default. */
export function AnnouncementSettings({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateAnnouncementBanner,
    enabled,
    formKey: "announcementEnabled",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="The grey strip at the very top of the homepage that invites visitors to join. Turn it off to hide it."
      id="announcement-enabled"
      onCheckedChange={toggle}
      pending={isPending}
      title="Show the join bar"
    />
  );
}
