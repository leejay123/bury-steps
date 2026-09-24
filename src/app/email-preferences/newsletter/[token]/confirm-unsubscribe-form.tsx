"use client";

import { useActionState } from "react";
import { confirmNewsletterUnsubscribe, type ActionResult } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { useActionToast } from "@/hooks/use-action-toast";

/**
 * One-click email links used to unsubscribe on GET, which meant Outlook
 * Safe Links / Gmail scanners could burn the subscription before the person
 * opened the page. Confirm with a real button click instead.
 */
export function ConfirmNewsletterUnsubscribeForm({ token }: { token: string }) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    confirmNewsletterUnsubscribe,
    null,
  );
  useActionToast(state);

  if (state?.ok) {
    return (
      <p className="text-sm text-muted-foreground">
        You won&rsquo;t get any more newsletter emails from us. You can subscribe again any time
        from the homepage.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col items-center gap-3">
      <input name="token" type="hidden" value={token} />
      <p className="text-sm text-muted-foreground">
        Confirm you want to stop receiving newsletter emails from this group.
      </p>
      <FormError message={state && !state.ok ? state.error : null} />
      <Button disabled={isPending} type="submit">
        {isPending ? "Unsubscribing…" : "Unsubscribe"}
      </Button>
    </form>
  );
}
