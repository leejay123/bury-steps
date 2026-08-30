"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { RotateCcw } from "lucide-react";
import { reopenWalk } from "@/server/actions";
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
      {pending ? "Reopening…" : "Reopen walk"}
    </Button>
  );
}

export function ReopenWalkButton({ walkId }: { walkId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useNotifyActionState(reopenWalk, () => setOpen(false));

  return (
    <AlertDialog
      closeDisabled={isPending}
      onOpenChange={preventDismissWhilePending(isPending, setOpen)}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button size="sm">
          <RotateCcw data-icon="inline-start" />
          Reopen walk
        </Button>
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
