"use client";

import { useState } from "react";
import {
  updateAccidentReportRetentionDays,
  updateCancelledWalkRetentionDays,
} from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_RETENTION_DAYS } from "@/lib/walk-retention";
import { SettingsSection } from "../settings-page";
import { useSaveBar } from "@/components/save-bar";

function daysToInput(value: number | null): string {
  return value && value > 0 ? String(value) : "";
}

/** "0" means none here, the same as leaving it blank (that's what saving it
 * stores), so it isn't an unsaved change against a blank one. */
function asSaved(value: string): string {
  return value.trim() !== "" && Number(value) === 0 ? "" : value;
}

export function CancelledWalkRetentionSettings({
  cancelledWalkRetentionDays,
}: {
  cancelledWalkRetentionDays: number | null;
}) {
  const saved = daysToInput(cancelledWalkRetentionDays);
  const [value, setValue] = useState(saved);
  const [state, action, pending, clearError] = useSafeActionState(updateCancelledWalkRetentionDays);
  useActionToast(state);

  useResetOnChange([saved], () => setValue(saved));

  const dirty = asSaved(value) !== saved;
  const form = useSaveBar(dirty, pending, () => {
    setValue(saved);
    clearError();
  });

  return (
    <SettingsSection
      description={`A cancelled walk that's never reopened is deleted automatically — along with its clock-ins — after this many days. Leave blank to never delete them. Flag an individual cancelled walk (from the walk itself) to keep it regardless. Up to ${MAX_RETENTION_DAYS.toLocaleString("en-GB")}.`}
      title="Cancelled walks"
    >
      <form action={action} ref={form} className="flex max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cancelledWalkRetentionDays">Days before deletion</Label>
          <Input
            id="cancelledWalkRetentionDays"
            inputMode="numeric"
            max={MAX_RETENTION_DAYS}
            min={0}
            name="cancelledWalkRetentionDays"
            onChange={(event) => setValue(event.target.value)}
            placeholder="e.g. 30 — leave blank for never"
            type="number"
            value={value}
          />
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
      </form>
    </SettingsSection>
  );
}

export function AccidentReportRetentionSettings({
  accidentReportRetentionDays,
}: {
  accidentReportRetentionDays: number | null;
}) {
  const saved = daysToInput(accidentReportRetentionDays);
  const [value, setValue] = useState(saved);
  const [state, action, pending, clearError] = useSafeActionState(updateAccidentReportRetentionDays);
  useActionToast(state);

  useResetOnChange([saved], () => setValue(saved));

  const dirty = asSaved(value) !== saved;
  const form = useSaveBar(dirty, pending, () => {
    setValue(saved);
    clearError();
  });

  return (
    <SettingsSection
      description={`An accident report is deleted automatically this many days after it was logged (not the incident date, and not reset by later edits). Leave blank to never delete them — this is the default. Flag an individual report (from the report itself) to keep it regardless. Up to ${MAX_RETENTION_DAYS.toLocaleString("en-GB")}.`}
      title="Accident reports"
    >
      <form action={action} ref={form} className="flex max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="accidentReportRetentionDays">Days before deletion</Label>
          <Input
            id="accidentReportRetentionDays"
            inputMode="numeric"
            max={MAX_RETENTION_DAYS}
            min={0}
            name="accidentReportRetentionDays"
            onChange={(event) => setValue(event.target.value)}
            placeholder="Never (blank)"
            type="number"
            value={value}
          />
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
      </form>
    </SettingsSection>
  );
}
