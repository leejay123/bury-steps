"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Ban } from "lucide-react";
import { cancelWalk } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
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

function CancelWalkDialogForm({
  attendanceCount,
  onClose,
  walkId,
}: {
  attendanceCount: number;
  onClose: () => void;
  walkId: string;
}) {
  const [state, action, isPending] = useNotifyActionState(cancelWalk, onClose);

  return (
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

export function CancelWalkButton({
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
        <Button size="sm" variant="outline">
          <Ban data-icon="inline-start" />
          Cancel walk
        </Button>
      </AlertDialogTrigger>
      {open ? (
        <CancelWalkDialogForm
          key={session}
          attendanceCount={attendanceCount}
          onClose={() => setOpen(false)}
          walkId={walkId}
        />
      ) : null}
    </AlertDialog>
  );
}
