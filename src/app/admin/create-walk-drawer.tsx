"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
    <Button className="w-full sm:w-auto" disabled={pending} type="submit">
      {pending ? "Creating…" : "Create walk"}
    </Button>
  );
}

/**
 * Was a form permanently on the page (see git history) — moved into a
 * Drawer behind a "Create a walk" button instead, so the Walks page opens
 * straight on the list rather than a form every visit.
 */
export function CreateWalkDrawer() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useNotifyActionState(createWalk, () => {
    formRef.current?.reset();
    setFormKey((key) => key + 1);
    setOpen(false);
  });

  return (
    <Drawer closeDisabled={isPending} onOpenChange={setOpen} open={open} variant="form">
      <DrawerTrigger asChild>
        <Button type="button">
          <Plus data-icon="inline-start" />
          Create a walk
        </Button>
      </DrawerTrigger>
      <DrawerContent className="min-h-0 sm:max-w-lg">
        <form action={action} className="flex min-h-0 flex-1 flex-col" ref={formRef}>
          <DrawerHeader className="shrink-0">
            <DrawerTitle>Create a walk</DrawerTitle>
            <DrawerDescription>
              A share link is generated automatically. People must be signed in to clock in. If
              they do not have an account yet, they create one first. If they already have one,
              they sign in. The link brings them back to this walk afterwards.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain px-4 pb-2">
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
          </div>
          <DrawerFooter>
            <Submit />
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
