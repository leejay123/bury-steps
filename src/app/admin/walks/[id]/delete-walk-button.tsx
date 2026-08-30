"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { deleteWalk } from "@/server/actions";
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
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Removing…" : "Remove walk"}
    </Button>
  );
}

function DeleteWalkDialogForm({
  attendanceCount,
  onClose,
  walkId,
}: {
  attendanceCount: number;
  onClose: () => void;
  walkId: string;
}) {
  const [state, action, isPending] = useNotifyActionState(deleteWalk, onClose);

  return (
    <AlertDialogContent closeDisabled={isPending}>
      <form action={action} className="space-y-4">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this walk?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                The walk and its share link will be deleted. People who open the old link will see
                that it no longer exists.
              </p>
              {attendanceCount > 0 ? (
                <p>
                  {attendanceCount === 1
                    ? "The one clock-in record for this walk will also be deleted."
                    : `The ${attendanceCount} clock-in records for this walk will also be deleted.`}
                </p>
              ) : null}
              <p>This cannot be undone from the app. To keep a record, cancel the walk instead.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input type="hidden" name="walkId" value={walkId} />
        <FormError message={state && !state.ok ? state.error : null} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} type="button">
            Keep the walk
          </AlertDialogCancel>
          <Confirm />
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}

export function DeleteWalkButton({
  walkId,
  attendanceCount,
}: {
  walkId: string;
  attendanceCount: number;
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
          <Trash2 data-icon="inline-start" />
          Remove walk
        </Button>
      </AlertDialogTrigger>
      {open ? (
        <DeleteWalkDialogForm
          key={session}
          attendanceCount={attendanceCount}
          onClose={() => setOpen(false)}
          walkId={walkId}
        />
      ) : null}
    </AlertDialog>
  );
}
