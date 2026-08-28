"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { reopenWalk, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
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
      {pending ? "Reopening…" : "Reopen walk"}
    </Button>
  );
}

export function ReopenWalkButton({ walkId }: { walkId: string }) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    reopenWalk,
    null,
  );
  const [open, setOpen] = useState(false);
  useActionToast(state, () => setOpen(false));

  return (
    <AlertDialog onOpenChange={(next) => setOpen(isPending ? true : next)} open={open}>
      <AlertDialogTrigger asChild>
        <Button size="sm">Reopen walk</Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={isPending}>
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Reopen this walk?</AlertDialogTitle>
            <AlertDialogDescription>
              The cancelled mark will come off. Members will be able to clock in again if the
              clock-in window is still open.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="walkId" type="hidden" value={walkId} />
          <FormError message={state && !state.ok ? state.error : null} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Keep it cancelled
            </AlertDialogCancel>
            <Confirm />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
