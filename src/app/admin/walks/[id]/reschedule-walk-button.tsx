"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { rescheduleWalk, type ActionResult } from "@/server/actions";
import { utcToLondonWallClock } from "@/lib/dates";
import { useActionToast } from "@/hooks/use-action-toast";
import { DateTimePicker } from "@/components/date-time-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function Confirm({ cancelled }: { cancelled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving…" : cancelled ? "Reschedule and reopen" : "Save new time"}
    </Button>
  );
}

export function RescheduleWalkButton({
  cancelled,
  durationMins,
  location,
  startsAt,
  walkId,
}: {
  cancelled: boolean;
  durationMins: number;
  location: string | null;
  startsAt: string;
  walkId: string;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    rescheduleWalk,
    null,
  );
  const [open, setOpen] = useState(false);
  useActionToast(state, () => setOpen(false));

  return (
    <AlertDialog onOpenChange={(next) => setOpen(isPending ? true : next)} open={open}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          Reschedule
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={isPending}>
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Reschedule this walk?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelled
                ? "Pick the new date and meeting point. The cancelled mark will come off."
                : "Change the date, time, length, or meeting point. Clock-ins already made stay on the walk."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="walkId" type="hidden" value={walkId} />
          <input name="wasCancelled" type="hidden" value={cancelled ? "on" : ""} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`reschedule-starts-${walkId}`}>Date and start time</Label>
              <DateTimePicker
                defaultValue={utcToLondonWallClock(new Date(startsAt))}
                id={`reschedule-starts-${walkId}`}
                name="startsAt"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`reschedule-duration-${walkId}`}>Expected length</Label>
              <Select defaultValue={String(durationMins)} name="durationMins">
                <SelectTrigger id={`reschedule-duration-${walkId}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[30, 45, 60, 90, 120, 150, 180, 240].map((mins) => (
                    <SelectItem key={mins} value={String(mins)}>
                      {mins < 60 ? `${mins} minutes` : `${mins / 60} ${mins === 60 ? "hour" : "hours"}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`reschedule-location-${walkId}`}>Meeting point</Label>
            <Input
              defaultValue={location ?? ""}
              id={`reschedule-location-${walkId}`}
              name="location"
              placeholder="Car park, Woodhill Road"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Keep this time
            </AlertDialogCancel>
            <Confirm cancelled={cancelled} />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
