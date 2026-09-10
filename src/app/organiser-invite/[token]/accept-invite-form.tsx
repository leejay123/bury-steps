"use client";

import { useEffect, useRef } from "react";
import { acceptOrganiserInvite } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";

/**
 * Auto-submits itself on mount — clicking the button in the invite email
 * *is* accepting; there's no reason to make the organiser click something
 * again once they land here. useNotifyActionState (rather than
 * useActionToast) handles the success case for us: when the action returns
 * an `href`, it flash-toasts "You're now an organiser." and hard-navigates
 * there — otherwise (viewer isn't currently signed in as the invitee) we
 * show the sign-in prompt below ourselves.
 */
export function AcceptInviteForm({
  signInHref,
  token,
}: {
  signInHref: string;
  token: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useNotifyActionState(acceptOrganiserInvite);

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  if (state?.ok && !state.href) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-medium">You&rsquo;re now an organiser.</p>
        <p className="text-sm text-muted-foreground">Sign in to see the admin area.</p>
        <Button asChild>
          <a href={signInHref}>Sign in</a>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col items-center gap-3" ref={formRef}>
      <input name="token" type="hidden" value={token} />
      <FormError message={state && !state.ok ? state.error : null} />
      {!state ? <p className="text-sm text-muted-foreground">Accepting your invite…</p> : null}
    </form>
  );
}
