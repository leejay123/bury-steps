"use client";

import { useActionState, useMemo, useState } from "react";
import type { ActionResult } from "@/server/actions";
import { safeServerAction } from "@/lib/action-errors";

/**
 * `useActionState` for a server action, except a request that fails outright
 * (offline, a dropped connection, the server restarting) comes back as an
 * `{ ok: false }` result with a plain message, shown like any other error.
 * Thrown, React hands it to the error page instead — the whole screen,
 * along with whatever had been typed into the form, was swapped for
 * "Something went wrong".
 */
export function useSafeActionState(
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>,
) {
  const safeAction = useMemo(() => safeServerAction(action), [action]);
  const [state, dispatch, pending] = useActionState<ActionResult | null, FormData>(safeAction, null);
  const [shown, clear] = useClearableResult(state);
  return [shown, dispatch, pending, clear] as const;
}

/**
 * The last result, and a way to put it away: a Discard that puts the saved
 * values back shouldn't leave an error about the ones it just threw away.
 * The next save shows its own result as usual.
 */
export function useClearableResult(result: ActionResult | null) {
  const [cleared, setCleared] = useState<ActionResult | null>(null);
  const shown = result !== null && result === cleared ? null : result;
  return [shown, () => setCleared(result)] as const;
}
