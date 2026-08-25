"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { cancelWalk, type ActionResult } from "@/server/actions";
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

function Confirm({ attendanceCount }: { attendanceCount: number }) {
  const { pending } = useFormStatus();
  return (
    <AlertDialogAction type="submit" disabled={pending}>
      {pending ? "Cancelling…" : "Cancel this walk"}
    </AlertDialogAction>
  );
}

export function CancelWalkButton({
  walkId,
  attendanceCount,
}: {
  walkId: string;
  attendanceCount: number;
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(cancelWalk, null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Walk cancelled.");
      setOpen(false);
    } else {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          Cancel walk
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this walk?</AlertDialogTitle>
          <AlertDialogDescription>
            {attendanceCount > 0
              ? `${attendanceCount} ${attendanceCount === 1 ? "person has" : "people have"} already clocked in. Their records are kept, but the walk will show as cancelled and nobody else can clock in.`
              : "The walk will show as cancelled and nobody will be able to clock in. You can't undo this from the app."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={action}>
          <input type="hidden" name="walkId" value={walkId} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Keep the walk</AlertDialogCancel>
            <Confirm attendanceCount={attendanceCount} />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
