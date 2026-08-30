"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { adminRemoveAttendance, type ActionResult } from "@/server/actions";
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
    <Button disabled={pending} type="submit" variant="destructive">
      {pending ? "Removing…" : "Remove from walk"}
    </Button>
  );
}

export function RemoveAttendanceButton({
  attendanceId,
  memberName,
}: {
  attendanceId: string;
  memberName: string;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    adminRemoveAttendance,
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
        <Button size="sm" variant="destructive">
          Remove from walk
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={isPending}>
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {memberName} from this walk?</AlertDialogTitle>
            <AlertDialogDescription>
              Their clock-in for this walk is deleted. They will no longer appear on the roster or
              in their walk history for this walk. You can add them again later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="attendanceId" type="hidden" value={attendanceId} />
          <FormError message={state && !state.ok ? state.error : null} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Keep them
            </AlertDialogCancel>
            <Confirm />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
