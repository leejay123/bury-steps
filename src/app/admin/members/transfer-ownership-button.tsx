"use client";

import { useActionState, useState } from "react";
import { transferOwnership, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
 * Hands the site's single "master organiser" role to another existing
 * organiser — see src/lib/site-owner.ts. Only ever rendered for the
 * current owner, on another organiser's row (never their own, and never a
 * plain member's — see the caller in members-table.tsx and
 * admin/members/[id]/page.tsx).
 */
export function TransferOwnershipButton({
  asMenuItem = false,
  name,
  onChanged,
  userId,
}: {
  /** Render the trigger as a DropdownMenuItem (for use inside
   * MemberRowActionsMenu) instead of a standalone Button. */
  asMenuItem?: boolean;
  name: string;
  onChanged?: () => void;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    transferOwnership,
    null,
  );
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
      {asMenuItem ? (
        <DropdownMenuItem onSelect={() => setOpen(true)}>Make owner</DropdownMenuItem>
      ) : (
        <Button onClick={() => setOpen(true)} size="xs" variant="outline">
          Make owner
        </Button>
      )}
      <AlertDialog
        closeDisabled={isPending}
        onOpenChange={preventDismissWhilePending(isPending, setOpen)}
        open={open}
      >
        <AlertDialogContent closeDisabled={isPending}>
          <form action={action} className="flex flex-col gap-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Make {name} the site owner?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {name} will gain full access to everything and become the only person who can
                    promote or demote an organiser, edit an organiser&rsquo;s permissions, or
                    remove an organiser&rsquo;s account.
                  </p>
                  <p>
                    You will keep your own current permissions as a regular organiser, but will no
                    longer be able to do any of that.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <input name="userId" type="hidden" value={userId} />
            <input name="confirm" type="hidden" value={confirmValue} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`transfer-owner-confirm-${userId}`}>
                Type &ldquo;{name}&rdquo; to continue
              </Label>
              <Input
                autoComplete="off"
                disabled={isPending}
                id={`transfer-owner-confirm-${userId}`}
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
                {isPending ? "Transferring…" : "Make owner"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
