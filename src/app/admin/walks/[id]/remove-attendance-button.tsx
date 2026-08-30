"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { adminRemoveAttendance } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
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

function RemoveAttendanceDialogForm({
  attendanceId,
  memberName,
  onClose,
}: {
  attendanceId: string;
  memberName: string;
  onClose: () => void;
}) {
  const [state, action, isPending] = useNotifyActionState(adminRemoveAttendance, onClose);

  return (
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
  );
}

export function RemoveAttendanceButton({
  attendanceId,
  memberName,
}: {
  attendanceId: string;
  memberName: string;
}) {
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
        <Button size="sm" variant="destructive">
          Remove from walk
        </Button>
      </AlertDialogTrigger>
      {open ? (
        <RemoveAttendanceDialogForm
          key={session}
          attendanceId={attendanceId}
          memberName={memberName}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </AlertDialog>
  );
}
