"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { clockIn, type ActionResult } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={disabled || pending}>
      {pending ? "Clocking in…" : "Clock in"}
    </Button>
  );
}

export function ClockInForm({ token }: { token: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(clockIn, null);
  const [ack, setAck] = useState(false);
  const [hasConditions, setHasConditions] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message ?? "Clocked in.");
    else toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="token" value={token} />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Pre-walk check</legend>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
          <Checkbox
            id="medicalAck"
            name="medicalAck"
            checked={ack}
            onCheckedChange={(v) => setAck(v === true)}
            className="mt-0.5 size-5"
          />
          <span className="text-sm leading-relaxed">
            I&rsquo;m fit to take part today. I understand walks are self-led and that I&rsquo;m
            responsible for my own safety. I consent to Bury Steps storing the health information
            I give below so walk leaders can respond if I need help.
          </span>
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium">
            Any active conditions the walk leader should know about?
          </p>
          <RadioGroup
            name="hasConditions"
            value={hasConditions ?? ""}
            onValueChange={(v) => setHasConditions(v as "yes" | "no")}
            className="grid gap-2 sm:grid-cols-2"
          >
            {(
              [
                ["no", "No conditions to report"],
                ["yes", "Yes \u2014 I will add details"],
              ] as const
            ).map(([value, label]) => (
              <Label
                key={value}
                htmlFor={`hc-${value}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
              >
                <RadioGroupItem id={`hc-${value}`} value={value} className="size-5" />
                <span>{label}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {hasConditions === "yes" && (
          <div className="space-y-1.5">
            <Label htmlFor="conditions">Active conditions</Label>
            <Textarea
              id="conditions"
              name="conditions"
              rows={3}
              maxLength={1000}
              placeholder="For example: asthma — inhaler in my rucksack; recent knee injury, taking it slowly."
            />
            <p className="text-xs text-muted-foreground">
              Only walk organisers can see this. It&rsquo;s deleted 90 days after the walk.
            </p>
          </div>
        )}
      </fieldset>

      <Submit disabled={!ack || hasConditions === null} />

      <p className="text-xs text-muted-foreground">
        Your clock-in time is recorded automatically when you tap the button.
      </p>
    </form>
  );
}
