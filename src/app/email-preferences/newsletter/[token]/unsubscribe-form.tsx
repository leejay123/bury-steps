"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { confirmNewsletterUnsubscribe, type ActionResult } from "@/server/actions";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Unsubscribing…" : "Unsubscribe"}
    </Button>
  );
}

export function NewsletterUnsubscribeForm({ email, token }: { email: string; token: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    confirmNewsletterUnsubscribe,
    null,
  );

  if (state?.ok) {
    return (
      <p className="text-sm text-muted-foreground">
        {email} won&apos;t get any more newsletter emails from us. You can subscribe again any
        time from the homepage.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        Stop sending the newsletter to <strong className="text-foreground">{email}</strong>?
      </p>
      <input name="token" type="hidden" value={token} />
      <FormError message={state && !state.ok ? state.error : null} />
      <Submit />
    </form>
  );
}
