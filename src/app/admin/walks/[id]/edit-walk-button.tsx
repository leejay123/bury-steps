"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateWalk, type ActionResult } from "@/server/actions";
import { utcToLondonWallClock } from "@/lib/dates";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { DateTimePicker } from "@/components/date-time-picker";
import { MeetingPointFields } from "@/components/meeting-point-fields";
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
      {pending ? "Saving…" : cancelled ? "Save and reopen" : "Save changes"}
    </Button>
  );
}

export function EditWalkButton({
  cancelled,
  description,
  durationMins,
  latitude,
  location,
  longitude,
  postcode,
  startsAt,
  title,
  walkId,
}: {
  cancelled: boolean;
  description: string | null;
  durationMins: number;
  latitude: number | null;
  location: string | null;
  longitude: number | null;
  postcode: string | null;
  startsAt: string;
  title: string;
  walkId: string;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    updateWalk,
    null,
  );
  const [open, setOpen] = useState(false);
  useActionToast(state, () => setOpen(false));

  return (
    <AlertDialog
      closeDisabled={isPending}
      onOpenChange={preventDismissWhilePending(isPending, setOpen)}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className="max-h-[min(90dvh,42rem)] overflow-y-auto sm:max-w-xl"
        closeDisabled={isPending}
      >
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit this walk?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelled
                ? "Change the details and put it back on the diary. The cancelled mark will come off. If you change the title, copy the share link again."
                : "Change the title, date, time, length, meeting point, or notes. People already clocked in stay on the walk. If you change the title, copy the share link again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="walkId" type="hidden" value={walkId} />
          <input name="wasCancelled" type="hidden" value={cancelled ? "on" : ""} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-title-${walkId}`} required>
              Title
            </Label>
            <Input
              defaultValue={title}
              id={`edit-title-${walkId}`}
              name="title"
              placeholder="Burrs Country Park loop"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`edit-starts-${walkId}`} required>
                Date and start time
              </Label>
              <DateTimePicker
                defaultValue={utcToLondonWallClock(new Date(startsAt))}
                id={`edit-starts-${walkId}`}
                name="startsAt"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`edit-duration-${walkId}`}>Expected length</Label>
              <Select defaultValue={String(durationMins)} name="durationMins">
                <SelectTrigger id={`edit-duration-${walkId}`}>
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
          <MeetingPointFields
            defaultLatitude={latitude}
            defaultLocation={location ?? ""}
            defaultLongitude={longitude}
            defaultPostcode={postcode ?? ""}
            idPrefix={`edit-${walkId}`}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-description-${walkId}`}>Description</Label>
            <Textarea
              defaultValue={description ?? ""}
              id={`edit-description-${walkId}`}
              name="description"
              placeholder="Roughly 4 miles, one steady climb. Boots recommended after rain."
              rows={3}
            />
          </div>
          <FormError message={state && !state.ok ? state.error : null} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Don’t save
            </AlertDialogCancel>
            <Confirm cancelled={cancelled} />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
