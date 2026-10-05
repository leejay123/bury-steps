"use client";

import { useActionState, useMemo } from "react";
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
  return useActionState<ActionResult | null, FormData>(safeAction, null);
}
