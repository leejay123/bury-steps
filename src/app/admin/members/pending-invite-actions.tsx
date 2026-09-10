"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cancelOrganiserInvite, resendOrganiserInvite, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { Button } from "@/components/ui/button";

function ResendSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} size="xs" type="submit" variant="outline">
      {pending ? "Sending…" : "Resend invite"}
    </Button>
  );
}

export function ResendInviteButton({ userId }: { userId: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(resendOrganiserInvite, null);
  useActionToast(state);
  return (
    <form action={action}>
      <input name="userId" type="hidden" value={userId} />
      <ResendSubmit />
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

export function CancelInviteButton({ userId }: { userId: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(cancelOrganiserInvite, null);
  useActionToast(state);
  return (
    <form action={action}>
      <input name="userId" type="hidden" value={userId} />
      <CancelSubmit />
    </form>
  );
}
