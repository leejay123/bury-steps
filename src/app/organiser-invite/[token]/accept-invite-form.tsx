"use client";

import { useFormStatus } from "react-dom";
import { acceptOrganiserInvite } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";

/**
 * Requires an actual click — do NOT auto-submit this on mount. This grants
 * real admin access on a single-use token, and a merely-loaded page is not
 * the same as a person choosing to accept: email link-scanners (Outlook
 * Safe Links, Gmail, various corporate security gateways) routinely
 * pre-fetch every link in an email before a human ever opens it, to check
 * it's safe. An auto-accepting page burns the one-time token to that
 * automated visit, and the real person then clicks the real link and gets
 * "invalid or already used." A real button press can't be triggered that
 * way.
 *
 * Only ever rendered once the page has already confirmed the viewer is
 * signed in as the invitee themselves, so the action always succeeds with
 * an `href` — useNotifyActionState flash-toasts "You're now an organiser."
 * and hard-navigates to the first admin page they were actually granted
 * (see adminLandingPath), not a fixed page every admin page now checks
 * its own permission for.
 */
function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Accepting…" : "Accept and become an organiser"}
    </Button>
  );
}

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action] = useNotifyActionState(acceptOrganiserInvite);

  return (
    <form action={action} className="flex flex-col items-center gap-3">
      <input name="token" type="hidden" value={token} />
      <FormError message={state && !state.ok ? state.error : null} />
      <Submit />
    </form>
  );
}
