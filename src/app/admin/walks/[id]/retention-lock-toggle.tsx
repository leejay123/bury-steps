"use client";

import { Loader2 } from "lucide-react";
import { setWalkRetentionLocked } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/** Flags this cancelled walk to exempt it from the cancelled-walk
 * auto-delete cron (Settings → Display → Retention). */
export function RetentionLockToggle({ locked, walkId }: { locked: boolean; walkId: string }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: (prev, formData) => {
      formData.set("walkId", walkId);
      return setWalkRetentionLocked(prev, formData);
    },
    enabled: locked,
    formKey: "retentionLocked",
  });

  return (
    <div className="flex items-center gap-2">
      {isPending ? (
        <Loader2 aria-label="Saving" className="size-4 shrink-0 animate-spin text-muted-foreground" role="status" />
      ) : (
        <Checkbox checked={on} id={`retention-locked-${walkId}`} onCheckedChange={(v) => toggle(v === true)} />
      )}
      <Label className="text-sm font-normal" htmlFor={`retention-locked-${walkId}`}>
        Keep — don&rsquo;t delete automatically
      </Label>
    </div>
  );
}
