"use client";

import { useActionState, useState } from "react";
import type React from "react";
import { setMemberRole, type ActionResult } from "@/server/actions";
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

/** Must type this word to confirm a role change either way — promoting and
 * demoting are both handled by the same typed-confirm dialog now that
 * there's no per-person permission picker to fill in on the way. */
export const ROLE_CONFIRM_WORD = "Confirm";

function RoleChangeDialog({
  inviteRequired,
  name,
  onChanged,
  open,
  promoting,
  setOpen,
  userId,
}: {
  inviteRequired: boolean;
  name: string;
  onChanged?: () => void;
  open: boolean;
  promoting: boolean;
  setOpen: (open: boolean) => void;
  userId: string;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    setMemberRole,
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
  const ready = confirmValue.trim().toLowerCase() === ROLE_CONFIRM_WORD.toLowerCase();

  const title = promoting
    ? inviteRequired
      ? `Invite ${name} to become an organiser?`
      : `Make ${name} an organiser?`
    : `Make ${name} a member?`;
  const submitLabel = promoting
    ? isPending
      ? inviteRequired
        ? "Inviting…"
        : "Promoting…"
      : inviteRequired
        ? "Invite as organiser"
        : "Make organiser"
    : isPending
      ? "Demoting…"
      : "Make member";

  return (
    <AlertDialog
      closeDisabled={isPending}
      onOpenChange={preventDismissWhilePending(isPending, setOpen)}
      open={open}
    >
      <AlertDialogContent closeDisabled={isPending}>
        {/*
          Use a normal submit Button — not AlertDialogAction. Radix Action
          closes the dialog on click, which unmounts the form before the
          server action can settle, so the role never appeared to change.
        */}
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {promoting ? (
                  inviteRequired ? (
                    <p>
                      They&rsquo;ll get an email with a link to accept, listing what an organiser
                      can do — walks and accident reports, not members, messages, or settings.
                      Nothing changes for them until they click it.
                    </p>
                  ) : (
                    <p>
                      They&rsquo;ll get the standard organiser access — walks and accident
                      reports, but not members, messages, health notes, or settings. Only owners
                      can see those.
                    </p>
                  )
                ) : (
                  <>
                    <p>
                      They will lose organiser tools and keep their member account, walk history,
                      and clock-ins.
                    </p>
                    <p>There must still be at least one organiser left in the group.</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="userId" type="hidden" value={userId} />
          <input name="role" type="hidden" value={promoting ? "ADMIN" : "MEMBER"} />
          <input name="confirm" type="hidden" value={confirmValue} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`role-confirm-${userId}`}>
              Type &ldquo;{ROLE_CONFIRM_WORD}&rdquo; to continue
            </Label>
            <Input
              autoComplete="off"
              disabled={isPending}
              id={`role-confirm-${userId}`}
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
            <Button disabled={isPending || !ready} type="submit">
              {submitLabel}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function MemberRoleButton({
  hideTrigger = false,
  inviteRequired = false,
  name,
  onChanged,
  role,
  triggerRef,
  userId,
}: {
  /** Visually hide the trigger button while keeping it mounted and
   * clickable via `triggerRef` — used when a MemberRowActionsMenu item
   * proxies a click to it, so the drawer/dialog this opens lives outside
   * the dropdown menu's own React tree. See MemberRowActionsMenu for why. */
  hideTrigger?: boolean;
  /** When true, promoting sends an invite the member must accept instead of
   * taking effect immediately — see Settings → Site behaviour. */
  inviteRequired?: boolean;
  name: string;
  /** Called after a successful change — lets a parent list re-fetch its own
   * local rows, which a plain router.refresh() doesn't reach on its own. */
  onChanged?: () => void;
  role: "ADMIN" | "MEMBER";
  triggerRef?: React.Ref<HTMLButtonElement>;
  userId: string;
}) {
  const promoting = role === "MEMBER";
  const [open, setOpen] = useState(false);
  const label = promoting ? (inviteRequired ? "Invite as organiser" : "Make organiser") : "Make member";

  return (
    <>
      <Button hidden={hideTrigger} onClick={() => setOpen(true)} ref={triggerRef} size="xs" variant="outline">
        {label}
      </Button>
      <RoleChangeDialog
        inviteRequired={inviteRequired}
        name={name}
        onChanged={onChanged}
        open={open}
        promoting={promoting}
        setOpen={setOpen}
        userId={userId}
      />
    </>
  );
}
