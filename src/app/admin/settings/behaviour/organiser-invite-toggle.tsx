"use client";

import { updateOrganiserInviteRequired } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { SettingsSwitchSection } from "../settings-page";

export function OrganiserInviteToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateOrganiserInviteRequired,
    enabled,
    formKey: "organiserInviteRequired",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="When on, making someone an organiser emails them an invite and they only become an organiser once they accept it. When off, it takes effect straight away."
      id="organiser-invite-required"
      onCheckedChange={toggle}
      pending={isPending}
      title="Require new organisers to accept an invite"
    />
  );
}
