"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clockIn, type ActionResult } from "@/server/actions";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

export function ClockInForm({
  emergencyContactName = "",
  emergencyContactPhone = "",
  emergencyContactRequired = false,
  token,
}: {
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  /** Settings → Site behaviour → Clock-in. Off still shows the fields. */
  emergencyContactRequired?: boolean;
  token: string;
}) {
  const router = useRouter();
  const [state, action] = useActionState<ActionResult | null, FormData>(clockIn, null);
  const [ack, setAck] = useState(false);
  const [hasConditions, setHasConditions] = useState<"yes" | "no" | null>(null);
  const [contactName, setContactName] = useState(emergencyContactName);
  const [contactPhone, setContactPhone] = useState(emergencyContactPhone);
  const contactReady =
    !emergencyContactRequired || (contactName.trim().length > 0 && contactPhone.trim().length > 0);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Clocked in.");
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [router, state]);

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

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Emergency contact</legend>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Who should we call if you need help on the walk? Only organisers can see this, and
          it stays on your account for next time.
          {emergencyContactRequired
            ? " You need a name and phone number before you can clock in."
            : " You can leave both blank."}
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="emergencyContactName">Name</Label>
          {/* Someone else's details — "name"/"tel" would autofill the member's own. */}
          <Input
            autoComplete="off"
            id="emergencyContactName"
            maxLength={80}
            name="emergencyContactName"
            onChange={(event) => setContactName(event.target.value)}
            value={contactName}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="emergencyContactPhone">Phone</Label>
          <Input
            autoComplete="off"
            id="emergencyContactPhone"
            inputMode="tel"
            maxLength={30}
            name="emergencyContactPhone"
            onChange={(event) => setContactPhone(event.target.value)}
            type="tel"
            value={contactPhone}
          />
        </div>
      </fieldset>

      <FormError message={state && !state.ok ? state.error : null} />

      <Submit disabled={!ack || hasConditions === null || !contactReady} />

      <p className="text-xs text-muted-foreground">
        Your clock-in time is recorded automatically when you tap the button.
      </p>
    </form>
  );
}
