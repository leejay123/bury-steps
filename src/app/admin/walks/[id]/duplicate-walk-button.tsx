"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Copy } from "lucide-react";
import { duplicateWalk } from "@/server/actions";
import { preventDismissWhilePending, useNotifyActionState } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
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

function Confirm() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Duplicating…" : "Duplicate walk"}
    </Button>
  );
}

export function DuplicateWalkButton({ walkId }: { walkId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useNotifyActionState(duplicateWalk, () => setOpen(false));

  // Once the action returns, stop blocking dismiss — otherwise a lagging
  // pending flag keeps the dialog on "Duplicating…" and can freeze the page
  // behind the overlay while navigation starts.
  const blocking = isPending && !state;

  return (
    <AlertDialog
      closeDisabled={blocking}
      onOpenChange={preventDismissWhilePending(blocking, setOpen)}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Copy data-icon="inline-start" />
          Duplicate
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={blocking}>
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate this walk?</AlertDialogTitle>
            <AlertDialogDescription>
              Creates a new walk with the same title, meeting point, length, and notes, starting
              one week later at the same time. Attendance and journey notes stay on the original.
              You will land on the new walk so you can check the date before sharing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="walkId" type="hidden" value={walkId} />
          <FormError message={state && !state.ok ? state.error : null} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blocking} type="button">
              Keep only this one
            </AlertDialogCancel>
            <Confirm />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
