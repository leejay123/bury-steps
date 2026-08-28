"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { deleteWalk, type ActionResult } from "@/server/actions";
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
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Removing…" : "Remove walk"}
    </Button>
  );
}

export function DeleteWalkButton({
  walkId,
  attendanceCount,
}: {
  walkId: string;
  attendanceCount: number;
}) {
  const router = useRouter();
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    deleteWalk,
    null,
  );
  const [open, setOpen] = useState(false);

  useActionToast(state, () => {
    setOpen(false);
    router.push("/admin");
  });

  return (
    <AlertDialog open={open} onOpenChange={(next) => setOpen(isPending ? true : next)}>
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="destructive">
          Remove walk
        </Button>
      </AlertDialogTrigger>
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
    </AlertDialog>
  );
}
