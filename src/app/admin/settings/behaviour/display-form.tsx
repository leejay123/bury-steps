"use client";

import { updateFooterWordmarkEnabled, updateScrollToTopEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { SettingsSwitchSection } from "../settings-page";

export function DisplaySettings({ scrollToTopEnabled }: { scrollToTopEnabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateScrollToTopEnabled,
    enabled: scrollToTopEnabled,
    formKey: "scrollToTopEnabled",
  });

  return (
    <SettingsSwitchSection
      checked={on}
      description="A small corner button appears once you scroll down, on the public site and in organiser tools."
      id="scroll-to-top"
      onCheckedChange={toggle}
      pending={isPending}
      title="Show a back-to-top button"
    />
  );
}

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
