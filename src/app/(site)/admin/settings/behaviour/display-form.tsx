"use client";

import { updateFooterWordmarkEnabled, updateFooterWordmarkMobile } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { SettingsSwitchSection } from "../settings-page";

export function FooterWordmarkSettings({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateFooterWordmarkEnabled,
    enabled,
    formKey: "footerWordmarkEnabled",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="A giant outlined site name at the very bottom of the homepage, which lights up under the pointer."
      id="footer-wordmark"
      onCheckedChange={toggle}
      pending={isPending}
      title="Show the big name in the footer"
    />
  );
}

export function FooterWordmarkMobileSettings({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateFooterWordmarkMobile,
    enabled,
    formKey: "footerWordmarkMobile",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="Off hides the big footer name on phones only — it still shows on tablets and computers."
      id="footer-wordmark-mobile"
      onCheckedChange={toggle}
      pending={isPending}
      title="Show the big name on phones"
    />
  );
}
