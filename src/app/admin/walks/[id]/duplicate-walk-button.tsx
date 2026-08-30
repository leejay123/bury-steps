"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Copy } from "lucide-react";
import { duplicateWalk, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
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
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    duplicateWalk,
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
          <Copy data-icon="inline-start" />
          Duplicate
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={isPending}>
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
            <AlertDialogCancel disabled={isPending} type="button">
              Keep only this one
            </AlertDialogCancel>
            <Confirm />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
