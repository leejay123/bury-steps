"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Flag } from "lucide-react";
import { endWalkEarly, END_WALK_MINUTES_AGO_OPTIONS } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
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

function minutesAgoLabel(minutes: number): string {
  return minutes === 0 ? "Just now" : `${minutes} minutes ago`;
}

function Confirm() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Ending…" : "End walk"}
    </Button>
  );
}

function EndWalkDialogForm({ onClose, walkId }: { onClose: () => void; walkId: string }) {
  const [state, action, isPending] = useNotifyActionState(endWalkEarly, onClose);

  return (
    <AlertDialogContent closeDisabled={isPending}>
      <form action={action} className="space-y-4">
        <AlertDialogHeader>
          <AlertDialogTitle>End this walk?</AlertDialogTitle>
          <AlertDialogDescription>
            Clock-in closes right away. Anyone still clocked in counts as having stayed for the
            whole (now-shorter) walk — same as if they just never got round to clocking out.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input type="hidden" name="walkId" value={walkId} />
        <div className="space-y-1.5">
          <Label htmlFor={`end-walk-when-${walkId}`}>When did it actually finish?</Label>
          <Select defaultValue="0" name="minutesAgo">
            <SelectTrigger id={`end-walk-when-${walkId}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {END_WALK_MINUTES_AGO_OPTIONS.map((minutes) => (
                <SelectItem key={minutes} value={String(minutes)}>
                  {minutesAgoLabel(minutes)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} type="button">
            Keep it going
          </AlertDialogCancel>
          <Confirm />
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}

/** Lets an organiser end a walk before its published length is up — either
 * right now, or backdated a few minutes if nobody was free to tap this the
 * moment it actually wrapped up. Only ever rendered while the walk is
 * in-progress (see the walk detail page). */
export function EndWalkButton({ walkId }: { walkId: string }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  return (
    <AlertDialog
      onOpenChange={(next) => {
        if (next) setSession((value) => value + 1);
        setOpen(next);
      }}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Flag data-icon="inline-start" />
          End walk
        </Button>
      </AlertDialogTrigger>
      {open ? <EndWalkDialogForm key={session} onClose={() => setOpen(false)} walkId={walkId} /> : null}
    </AlertDialog>
  );
}
