"use client";

import { useActionState, useState } from "react";
import type React from "react";
import { addOwner, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
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

/**
 * Grants another existing organiser owner access alongside the acting
 * owner's own — see src/lib/site-owner.ts. Only ever rendered for a
 * current owner, on another organiser's row (never their own, and never a
 * plain member's — see the caller in members-table.tsx and
 * admin/members/[id]/page.tsx). Unlike TransferOwnershipButton, the acting
 * owner keeps their own access afterward.
 */
export function AddOwnerButton({
  hideTrigger = false,
  name,
  onChanged,
  triggerRef,
  userId,
}: {
  /** Visually hide the trigger button while keeping it mounted and
   * clickable via `triggerRef` — used when a MemberRowActionsMenu item
   * proxies a click to it, so the dialog this opens lives outside the
   * dropdown menu's own React tree. See MemberRowActionsMenu for why. */
  hideTrigger?: boolean;
  name: string;
  onChanged?: () => void;
  triggerRef?: React.Ref<HTMLButtonElement>;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(addOwner, null);
  const [confirmValue, setConfirmValue] = useState("");
  useActionToast(state, () => {
    setOpen(false);
    onChanged?.();
  });
  useResetOnChange([open], () => {
    if (!open) setConfirmValue("");
  });
  const ready = confirmValue.trim().toLowerCase() === name.trim().toLowerCase();

  return (
    <>
      <Button hidden={hideTrigger} onClick={() => setOpen(true)} ref={triggerRef} size="xs" variant="outline">
        Add as co-owner
      </Button>
      <AlertDialog
        closeDisabled={isPending}
        onOpenChange={preventDismissWhilePending(isPending, setOpen)}
        open={open}
      >
        <AlertDialogContent closeDisabled={isPending}>
          <form action={action} className="flex flex-col gap-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Make {name} a co-owner?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {name} will gain full access to everything — able to promote or demote an
                    organiser, remove an account, manage who else is an owner, and use every
                    organiser tool (Members, Messages, Settings, health notes), same as you.
                  </p>
                  <p>You keep your own owner access too — this adds them, it doesn&rsquo;t replace you.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <input name="userId" type="hidden" value={userId} />
            <input name="confirm" type="hidden" value={confirmValue} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`add-owner-confirm-${userId}`}>Type &ldquo;{name}&rdquo; to continue</Label>
              <Input
                autoComplete="off"
                disabled={isPending}
                id={`add-owner-confirm-${userId}`}
                onChange={(event) => setConfirmValue(event.target.value)}
                placeholder={name}
                spellCheck={false}
                value={confirmValue}
              />
            </div>
            <FormError message={state && !state.ok ? state.error : null} />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending} type="button">
                Cancel
              </AlertDialogCancel>
              <Button disabled={isPending || !ready} type="submit">
                {isPending ? "Adding…" : "Add as co-owner"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
