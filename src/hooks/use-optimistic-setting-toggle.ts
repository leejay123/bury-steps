"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/server/actions";
import { actionResultErrorMessage, safeServerAction } from "@/lib/action-errors";
import { useResetOnChange } from "@/hooks/use-reset-on-change";

/**
 * A single on/off admin setting backed by a server action: flips
 * immediately when tapped (optimistic), shows a "Saving…" hint while the
 * action is in flight, reverts and toasts on failure, and toasts the
 * server's confirmation message on success.
 */
export function useOptimisticSettingToggle({
  enabled,
  action,
  formKey,
}: {
  enabled: boolean;
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  formKey: string;
}) {
  const [on, setOn] = useState(enabled);
  const safeAction = useMemo(() => safeServerAction(action), [action]);
  const [state, dispatch, isPending] = useActionState<ActionResult | null, FormData>(
    safeAction,
    null,
  );

  useResetOnChange([enabled], () => setOn(enabled));

  // The checkbox already flipped optimistically when tapped — put it back
  // so the UI doesn't keep claiming a state the save never reached.
  useResetOnChange([state, enabled], () => {
    if (state && !state.ok) setOn(enabled);
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast.success(state.message);
    } else {
      toast.error(actionResultErrorMessage(state.error));
    }
  }, [state, enabled]);

  function toggle(next: boolean) {
    if (next === on) return;
    setOn(next);
    const formData = new FormData();
    formData.set(formKey, next ? "on" : "");
    startTransition(() => {
      dispatch(formData);
    });
  }

  return { on, toggle, isPending };
}
