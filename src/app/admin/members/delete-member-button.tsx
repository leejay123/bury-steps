"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { deleteMember, type ActionResult } from "@/server/actions";
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
    <AlertDialogAction type="submit" disabled={pending} className="bg-destructive text-white hover:bg-destructive/90">
      {pending ? "Removing…" : "Remove member"}
    </AlertDialogAction>
  );
}

export function DeleteMemberButton({
  userId,
  name,
  walkCount,
  attendanceCount,
}: {
  userId: string;
  name: string;
  walkCount: number;
  attendanceCount: number;
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(deleteMember, null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Member removed.");
      setOpen(false);
    } else {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="outline">
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {name}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>They will be signed out and will not be able to clock in unless they join again.</p>
              {attendanceCount > 0 && (
                <p>
                  {attendanceCount === 1
                    ? "Their one clock-in record will be deleted."
                    : `Their ${attendanceCount} clock-in records will be deleted.`}
                </p>
              )}
              {walkCount > 0 && (
                <p>
                  Walks they created will stay in the group and be listed under you.
                </p>
              )}
              <p>This cannot be undone from the app.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={action}>
          <input type="hidden" name="userId" value={userId} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Keep member</AlertDialogCancel>
            <Confirm />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
