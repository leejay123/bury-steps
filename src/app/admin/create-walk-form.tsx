"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createWalk, type ActionResult } from "@/server/actions";
import { DateTimePicker } from "@/components/date-time-picker";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create walk"}
    </Button>
  );
}

export function CreateWalkForm() {
  const [formKey, setFormKey] = useState(0);
  const [state, action] = useActionState<ActionResult | null, FormData>(createWalk, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Walk created.");
      formRef.current?.reset();
      setFormKey((key) => key + 1);
    } else {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title" required>
          Title
        </Label>
        <Input id="title" name="title" required placeholder="Burrs Country Park loop" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startsAt" required>
            Date and start time
          </Label>
          <DateTimePicker id="startsAt" key={formKey} name="startsAt" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="durationMins">Expected length</Label>
          <Select name="durationMins" defaultValue="90">
            <SelectTrigger id="durationMins">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[30, 45, 60, 90, 120, 150, 180, 240].map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m < 60 ? `${m} minutes` : `${m / 60} ${m === 60 ? "hour" : "hours"}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Meeting point</Label>
        <Input
          id="location"
          name="location"
          placeholder="Burrs Country Park visitor centre, Bury"
        />
        <p className="text-xs text-muted-foreground">
          Used for the map and Get directions. Include the park or street and the town so the pin
          can be found.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Roughly 4 miles, one steady climb. Boots recommended after rain."
        />
      </div>

      <FormError message={state && !state.ok ? state.error : null} />

      <Submit />
    </form>
  );
}
