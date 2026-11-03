"use client";

import { updateEmergencyContactRequired } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { SettingsSwitchSection } from "../settings-page";

export function EmergencyContactToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateEmergencyContactRequired,
    enabled,
    formKey: "emergencyContactRequired",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="When on, a member must enter a name and phone number before they can clock in. When off, the same fields are there and can be left blank. Either way, what they enter is saved on their account and only organisers can see it."
      id="emergency-contact-required"
      onCheckedChange={toggle}
      pending={isPending}
      title="Require an emergency contact"
    />
  );
}
