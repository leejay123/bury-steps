"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { cancelOrganiserInvite, resendOrganiserInvite, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
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
  const [state, action] = useActionState<ActionResult | null, FormData>(cancelOrganiserInvite, null);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, onDone);
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
