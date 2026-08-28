"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { clockOut, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

function Confirm({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} type="submit" variant="destructive">
      {pending ? "Clocking out…" : "Clock out"}
    </Button>
  );
}

export function ClockOutButton({ token }: { token: string }) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    clockOut,
    null,
  );
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  useActionToast(state, () => {
    setOpen(false);
    setReason("");
  });

  return (
    <AlertDialog
      onOpenChange={(next) => {
        if (isPending) {
          setOpen(true);
          return;
        }
        setOpen(next);
        if (!next) setReason("");
      }}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          Clock out
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={isPending}>
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Clock out of this walk?</AlertDialogTitle>
            <AlertDialogDescription>
              Your name will come off the list other members see. Organisers will still see that you
              clocked out, and the reason you give.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="token" type="hidden" value={token} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`clock-out-reason-${token}`}>Why are you clocking out?</Label>
            <Textarea
              id={`clock-out-reason-${token}`}
              maxLength={500}
              name="reason"
              onChange={(event) => setReason(event.target.value)}
              placeholder="I need to leave early, not feeling well…"
              required
              rows={3}
              value={reason}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Stay clocked in
            </AlertDialogCancel>
            <Confirm disabled={reason.trim().length < 3} />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
