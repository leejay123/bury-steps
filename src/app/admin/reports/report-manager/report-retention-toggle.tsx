"use client";

import { Loader2 } from "lucide-react";
import { setAccidentReportRetentionLocked } from "@/server/actions";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/** Flags this report to exempt it from the accident-report auto-delete cron
 * (Settings → Display → Retention). */
export function ReportRetentionToggle({ locked, reportId }: { locked: boolean; reportId: string }) {
  const { on, toggle, isPending } = useOptimisticSettingToggle({
    action: (prev, formData) => {
      formData.set("reportId", reportId);
      return setAccidentReportRetentionLocked(prev, formData);
    },
    enabled: locked,
    formKey: "retentionLocked",
  });

  return (
    <div className="flex items-center gap-2">
      {isPending ? (
        <Loader2 aria-label="Saving" className="size-4 shrink-0 animate-spin text-muted-foreground" role="status" />
      ) : (
        <Checkbox
          checked={on}
          id={`report-retention-locked-${reportId}`}
          onCheckedChange={(v) => toggle(v === true)}
        />
      )}
      <Label className="text-sm font-normal" htmlFor={`report-retention-locked-${reportId}`}>
        Keep — don&rsquo;t delete automatically
      </Label>
    </div>
  );
}
