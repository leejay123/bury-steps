"use client";

import { updateMemberNoticesEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { SettingsSwitchSection } from "../settings-page";

export function MemberNoticesToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateMemberNoticesEnabled,
    enabled,
    formKey: "memberNoticesEnabled",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="Signed-in members see recent notices in a carousel on the homepage. Turning this off hides that section for everyone — the bell and the Notices page are unaffected."
      id="member-notices-enabled"
      onCheckedChange={toggle}
      pending={isPending}
      title="Show Latest notices"
    />
  );
}
