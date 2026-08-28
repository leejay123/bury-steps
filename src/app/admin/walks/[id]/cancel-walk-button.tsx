"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelWalk, type ActionResult } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    <Button type="submit" disabled={pending}>
      {pending ? "Cancelling…" : "Cancel this walk"}
    </Button>
  );
}

export function CancelWalkButton({
  walkId,
  attendanceCount,
}: {
  walkId: string;
  attendanceCount: number;
}) {
  const router = useRouter();
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    cancelWalk,
    null,
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Walk cancelled.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [router, state]);

  return (
    <AlertDialog open={open} onOpenChange={(next) => setOpen(isPending ? true : next)}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          Cancel walk
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={isPending}>
        <form action={action} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this walk?</AlertDialogTitle>
            <AlertDialogDescription>
              {attendanceCount > 0
                ? `${attendanceCount} ${attendanceCount === 1 ? "person has" : "people have"} already clocked in. Their records are kept, but the walk will show as cancelled and nobody else can clock in.`
                : "The walk will show as cancelled and nobody will be able to clock in."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input type="hidden" name="walkId" value={walkId} />
          <div className="space-y-1.5">
            <Label htmlFor={`cancel-reason-${walkId}`}>Reason (optional)</Label>
            <Textarea
              id={`cancel-reason-${walkId}`}
              name="reason"
              rows={3}
              maxLength={500}
              placeholder="Weather, illness, not enough people…"
            />
          </div>
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
