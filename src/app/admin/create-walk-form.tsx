"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createWalk } from "@/server/actions";
import { DateTimePicker } from "@/components/date-time-picker";
import { MeetingPointFields } from "@/components/meeting-point-fields";
import { FormError } from "@/components/form-error";
import { useNotifyActionState } from "@/hooks/use-action-toast";
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
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useNotifyActionState(createWalk, () => {
    formRef.current?.reset();
    setFormKey((key) => key + 1);
  });

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
          <DateTimePicker disablePast id="startsAt" key={formKey} name="startsAt" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="durationMins">Expected length</Label>
          <Select key={formKey} name="durationMins" defaultValue="90">
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

      <MeetingPointFields idPrefix="create-walk" key={formKey} />

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
