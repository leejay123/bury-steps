"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteMember, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ROLE_CONFIRM_WORD } from "./member-role-button";

function ConfirmSubmit({ confirmValue }: { confirmValue: string }) {
  const { pending } = useFormStatus();
  const ready = confirmValue.trim().toLowerCase() === ROLE_CONFIRM_WORD.toLowerCase();
  return (
    <Button
      className="bg-destructive text-white hover:bg-destructive/90"
      disabled={pending || !ready}
      type="submit"
      variant="destructive"
    >
      {pending ? "Removing…" : "Remove member"}
    </Button>
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
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    deleteMember,
    null,
  );
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  // Close only — navigation (when redirectTo is set) goes through ActionResult.href
  // so useActionToast can show the success sonner first, then hard-navigate after
  // a short delay. Soft router.push in onOk used to leave before the toast painted.
  useActionToast(state, () => setOpen(false));

  useEffect(() => {
    if (!open) setConfirmValue("");
  }, [open]);

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
        {/*
          Use a normal submit Button — not AlertDialogAction. Radix Action
          closes the dialog on click, which unmounts the form before the
          server action can settle (same bug as role change).
        */}
        <form action={action} className="flex flex-col gap-4">
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
                  <p>Walks they created will stay in the group and be listed under you.</p>
                )}
                <p>This cannot be undone from the app.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="userId" type="hidden" value={userId} />
          <input name="confirm" type="hidden" value={confirmValue} />
          {redirectTo ? <input name="redirectTo" type="hidden" value={redirectTo} /> : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`delete-confirm-${userId}`}>
              Type &ldquo;{ROLE_CONFIRM_WORD}&rdquo; to continue
            </Label>
            <Input
              autoComplete="off"
              disabled={isPending}
              id={`delete-confirm-${userId}`}
              onChange={(event) => setConfirmValue(event.target.value)}
              placeholder={ROLE_CONFIRM_WORD}
              spellCheck={false}
              value={confirmValue}
            />
          </div>
          <FormError message={state && !state.ok ? state.error : null} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Keep member
            </AlertDialogCancel>
            <ConfirmSubmit confirmValue={confirmValue} />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
