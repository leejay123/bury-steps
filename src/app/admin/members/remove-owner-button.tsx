"use client";

import { useState } from "react";
import type React from "react";
import { useFormStatus } from "react-dom";
import { removeOwner } from "@/server/actions";
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
} from "@/components/ui/alert-dialog";
import { ROLE_CONFIRM_WORD } from "./member-role-button";

function ConfirmSubmit({ confirmValue }: { confirmValue: string }) {
  const { pending } = useFormStatus();
  const ready = confirmValue.trim().toLowerCase() === ROLE_CONFIRM_WORD.toLowerCase();
  return (
    <Button disabled={pending || !ready} type="submit">
      {pending ? "Removing…" : "Remove as owner"}
    </Button>
  );
}

function RemoveOwnerDialogForm({
  name,
  onClose,
  userId,
}: {
  name: string;
  onClose: () => void;
  userId: string;
}) {
  const [confirmValue, setConfirmValue] = useState("");
  const [state, action, isPending] = useNotifyActionState(removeOwner, onClose, { toastErrors: true });

  return (
    <AlertDialogContent closeDisabled={isPending}>
      <form action={action} className="flex flex-col gap-4">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {name} as an owner?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                {name} stays an organiser — they just lose the ability to promote or demote an
                organiser, remove an account, manage who else is an owner, or use owner-only
                tools (Members, Messages, Settings, health notes). Refused if they are the
                group&rsquo;s last remaining owner.
              </p>
              <p>You can add them back as an owner again at any time.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input name="userId" type="hidden" value={userId} />
        <input name="confirm" type="hidden" value={confirmValue} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`remove-owner-confirm-${userId}`}>
            Type &ldquo;{ROLE_CONFIRM_WORD}&rdquo; to continue
          </Label>
          <Input
            autoComplete="off"
            disabled={isPending}
            id={`remove-owner-confirm-${userId}`}
            onChange={(event) => setConfirmValue(event.target.value)}
            placeholder={ROLE_CONFIRM_WORD}
            spellCheck={false}
            value={confirmValue}
          />
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} type="button">
            Cancel
          </AlertDialogCancel>
          <ConfirmSubmit confirmValue={confirmValue} />
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}

/**
 * Strips owner access from one of the group's owners, leaving them a
 * regular organiser — see src/lib/site-owner.ts. Only ever rendered for a
 * current owner, on another owner's row (never their own — see the
 * "changing your own role" reasoning in members-table.tsx — and never a
 * plain organiser's or member's, who have nothing to remove).
 */
export function RemoveOwnerButton({
  hideTrigger = false,
  name,
  onChanged,
  triggerRef,
  userId,
}: {
  hideTrigger?: boolean;
  name: string;
  onChanged?: () => void;
  triggerRef?: React.Ref<HTMLButtonElement>;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  function openDialog() {
    setSession((value) => value + 1);
    setOpen(true);
  }

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <Button hidden={hideTrigger} onClick={openDialog} ref={triggerRef} size="xs" variant="outline">
        Remove as owner
      </Button>
      {open ? (
        <RemoveOwnerDialogForm
          key={session}
          name={name}
          onClose={() => {
            setOpen(false);
            onChanged?.();
          }}
          userId={userId}
        />
      ) : null}
    </AlertDialog>
  );
}
