"use client";

import { Loader2 } from "lucide-react";
import { updateProgressEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "../settings-page";

export function ProgressToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateProgressEnabled,
    enabled,
    formKey: "progressEnabled",
  });

  return (
    <SettingsSection
      description="How we walk together this month — clock-ins, not miles or speed. Turning this off removes it for everyone, organisers included, not just members."
      title="Progress"
    >
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Label className="font-medium" htmlFor="progress-enabled">
            Show the Progress page
          </Label>
        </div>
        {isPending ? (
          <Loader2 aria-label="Saving" className="size-4 shrink-0 animate-spin text-muted-foreground" role="status" />
        ) : (
          <Checkbox
            checked={on}
            id="progress-enabled"
            onCheckedChange={(value) => toggle(value === true)}
          />
        )}
      </div>
    </SettingsSection>
  );
}
