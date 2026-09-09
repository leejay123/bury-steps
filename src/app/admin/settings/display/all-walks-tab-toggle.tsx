"use client";

import { Loader2 } from "lucide-react";
import { updateAllWalksTabEnabled } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "../settings-page";

export function AllWalksTabToggle({ enabled }: { enabled: boolean }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: updateAllWalksTabEnabled,
    enabled,
    formKey: "allWalksTabEnabled",
  });

  return (
    <SettingsSection
      description="Adds an “All walks” tab to every member's Walks page, listing every completed walk site-wide (title, date, and location only). A member still only sees who attended for walks they were on themselves — this doesn't change that."
      title="All walks tab"
    >
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Label className="font-medium" htmlFor="all-walks-tab-enabled">
            Show to members
          </Label>
        </div>
        {isPending ? (
          <Loader2 aria-label="Saving" className="size-4 shrink-0 animate-spin text-muted-foreground" role="status" />
        ) : (
          <Checkbox
            checked={on}
            id="all-walks-tab-enabled"
            onCheckedChange={(value) => toggle(value === true)}
          />
        )}
      </div>
    </SettingsSection>
  );
}
