"use client";

import { updateScrollToTopEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "../settings-page";

export function DisplaySettings({ scrollToTopEnabled }: { scrollToTopEnabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateScrollToTopEnabled,
    enabled: scrollToTopEnabled,
    formKey: "scrollToTopEnabled",
  });

  return (
    <SettingsSection
      description="A corner button appears after you scroll down, on the public site and in organiser tools."
      title="Back to top"
    >
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Label className="font-medium" htmlFor="scroll-to-top">
            Show the button
          </Label>
          {isPending ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
        </div>
        <Checkbox
          checked={on}
          disabled={isPending}
          id="scroll-to-top"
          onCheckedChange={(value) => toggle(value === true)}
        />
      </div>
    </SettingsSection>
  );
}
