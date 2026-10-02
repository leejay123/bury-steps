"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Footprints } from "lucide-react";
import { adminClockIn, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full sm:w-auto" disabled={pending} size="sm" type="submit" variant="outline">
      <Footprints data-icon="inline-start" />
      {pending ? "Clocking in…" : "Clock in"}
    </Button>
  );
}

/** One-tap self clock-in for an organiser who's also walking — reuses
 * adminClockIn (same "no medical consent form, recorded now" shortcut
 * already used for adding someone else who couldn't clock in themselves),
 * just always targeting the organiser's own account. No confirmation
 * dialog, unlike Add someone — this only ever affects the organiser's own
 * attendance, not someone else's. */
export function SelfClockInButton({ adminId, walkId }: { adminId: string; walkId: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(adminClockIn, null);
  useActionToast(state);

  return (
    <form action={action}>
      <input name="walkId" type="hidden" value={walkId} />
      <input name="userId" type="hidden" value={adminId} />
      <Submit />
    </form>
  );
}
