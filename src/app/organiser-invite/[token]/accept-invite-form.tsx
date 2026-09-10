"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { acceptOrganiserInvite, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Accepting…" : "Accept and become an organiser"}
    </Button>
  );
}

export function AcceptInviteForm({ token }: { token: string }) {
  const [accepted, setAccepted] = useState(false);
  const [state, action] = useActionState<ActionResult | null, FormData>(acceptOrganiserInvite, null);
  useActionToast(state, () => setAccepted(true));

  if (accepted) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-medium">You&rsquo;re now an organiser.</p>
        <Button asChild>
          <Link href="/admin">Open the admin area</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col items-center gap-3">
      <input name="token" type="hidden" value={token} />
      <FormError message={state && !state.ok ? state.error : null} />
      <Submit />
    </form>
  );
}
