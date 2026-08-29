"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateMonthlyClockInGoal, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_MONTHLY_CLOCK_IN_GOAL } from "@/lib/walk-game";

function goalToInput(value: number | null): string {
  return value && value > 0 ? String(value) : "";
}

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function ProgressSettingsForm({
  monthlyClockInGoal,
}: {
  monthlyClockInGoal: number | null;
}) {
  const saved = goalToInput(monthlyClockInGoal);
  const [value, setValue] = useState(saved);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateMonthlyClockInGoal,
    null,
  );
  useActionToast(state);

  useEffect(() => {
    setValue(saved);
  }, [saved]);

  const dirty = value !== saved;

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="monthlyClockInGoal">Monthly together goal</Label>
        <Input
          id="monthlyClockInGoal"
          inputMode="numeric"
          max={MAX_MONTHLY_CLOCK_IN_GOAL}
          min={0}
          name="monthlyClockInGoal"
          onChange={(event) => setValue(event.target.value)}
          placeholder="Leave blank for none"
          type="number"
          value={value}
        />
        <p className="text-sm text-muted-foreground">
          Total clock-ins across the group this month, not a race. Up to{" "}
          {MAX_MONTHLY_CLOCK_IN_GOAL.toLocaleString("en-GB")}.
        </p>
      </div>
      <FormError message={state && !state.ok ? state.error : null} />
      <div className="flex flex-wrap gap-2">
        <Submit disabled={!dirty} />
        {dirty ? (
          <Button onClick={() => setValue(saved)} type="button" variant="outline">
            Discard
          </Button>
        ) : null}
      </div>
    </form>
  );
}
