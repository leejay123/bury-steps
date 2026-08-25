"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteWalk, type ActionResult } from "@/server/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
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
    <AlertDialogAction
      type="submit"
      disabled={pending}
      className="bg-destructive text-white hover:bg-destructive/90"
    >
      {pending ? "Removing…" : "Remove walk"}
    </AlertDialogAction>
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
  const [state, action] = useActionState<ActionResult | null, FormData>(deleteWalk, null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Walk removed.");
      setOpen(false);
      router.push("/admin");
    } else {
      toast.error(state.error);
    }
  }, [router, state]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive">
          Remove walk
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
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
        <form action={action}>
          <input type="hidden" name="walkId" value={walkId} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Keep the walk</AlertDialogCancel>
            <Confirm />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
