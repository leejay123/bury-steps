"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { cancelOrganiserInvite, resendOrganiserInvite, type ActionResult } from "@/server/actions";
import { useActionToast, useNotifyActionState } from "@/hooks/use-action-toast";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

function ResendSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} size="xs" type="submit" variant="outline">
      {pending ? "Sending…" : "Resend invite"}
    </Button>
  );
}

export function ResendInviteButton({
  asMenuItem = false,
  onDone,
  userId,
}: {
  /** Render as a DropdownMenuItem (for use inside MemberRowActionsMenu)
   * instead of a standalone Button — submits the same form either way. */
  asMenuItem?: boolean;
  onDone?: () => void;
  userId: string;
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(resendOrganiserInvite, null);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, onDone);
  return (
    <form action={action} ref={formRef}>
      <input name="userId" type="hidden" value={userId} />
      {asMenuItem ? (
        <DropdownMenuItem onSelect={() => formRef.current?.requestSubmit()}>Resend invite</DropdownMenuItem>
      ) : (
        <ResendSubmit />
      )}
    </form>
  );
}

function CancelSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} size="xs" type="submit" variant="outline">
      {pending ? "Cancelling…" : "Cancel invite"}
    </Button>
  );
}

export function CancelInviteButton({
  asMenuItem = false,
  onDone,
  userId,
}: {
  /** Render as a DropdownMenuItem (for use inside MemberRowActionsMenu)
   * instead of a standalone Button — submits the same form either way. */
  asMenuItem?: boolean;
  onDone?: () => void;
  userId: string;
}) {
  // useNotifyActionState, not useActionToast: cancelling clears the
  // pending invite, so this row (and this button with it) re-renders
  // without a pending-invite state — or unmounts entirely, if the parent
  // list filters pending invites out — as part of the same refresh the
  // success toast depends on. useActionToast's effect can lose that race
  // and never fire; useNotifyActionState toasts immediately once the
  // action itself returns, before any of that unmounting happens.
  // toastErrors: true — this button has no inline FormError of its own to
  // show a failure (e.g. someone else already cancelled it first), so the
  // toast is the only place that would ever surface one.
  const [, action] = useNotifyActionState(cancelOrganiserInvite, onDone, { toastErrors: true });
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form action={action} ref={formRef}>
      <input name="userId" type="hidden" value={userId} />
      {asMenuItem ? (
        <DropdownMenuItem onSelect={() => formRef.current?.requestSubmit()} variant="destructive">
          Cancel invite
        </DropdownMenuItem>
      ) : (
        <CancelSubmit />
      )}
    </form>
  );
}
