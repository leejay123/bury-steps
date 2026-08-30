"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteMember } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
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

function DeleteMemberDialogForm({
  attendanceCount,
  name,
  onClose,
  redirectTo,
  userId,
  walkCount,
}: {
  attendanceCount: number;
  name: string;
  onClose: () => void;
  redirectTo?: string;
  userId: string;
  walkCount: number;
}) {
  const [confirmValue, setConfirmValue] = useState("");
  const [state, action, isPending] = useNotifyActionState(deleteMember, onClose);

  return (
    <AlertDialogContent closeDisabled={isPending}>
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
        <Button size="xs" variant="outline">
          Remove
        </Button>
      </AlertDialogTrigger>
      {open ? (
        <DeleteMemberDialogForm
          key={session}
          attendanceCount={attendanceCount}
          name={name}
          onClose={() => setOpen(false)}
          redirectTo={redirectTo}
          userId={userId}
          walkCount={walkCount}
        />
      ) : null}
    </AlertDialog>
  );
}
