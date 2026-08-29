"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { deleteMember, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
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
  redirectTo,
}: {
  userId: string;
  name: string;
  walkCount: number;
  attendanceCount: number;
  /** Where to navigate after removal — used when this button lives on the member's own page, which no longer exists once they are removed. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    deleteMember,
    null,
  );
  const [open, setOpen] = useState(false);
  // The hook's own router.refresh() re-fetches whichever page this button
  // lives on (the members list, or the member's own page before it
  // redirects away) so it never shows a member who was just removed.
  useActionToast(state, () => {
    setOpen(false);
    if (redirectTo) router.push(redirectTo);
  });

  return (
    <AlertDialog
      closeDisabled={isPending}
      onOpenChange={preventDismissWhilePending(isPending, setOpen)}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="outline">
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={isPending}>
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
          <FormError message={state && !state.ok ? state.error : null} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Keep member
            </AlertDialogCancel>
            <Confirm />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
