"use client";

import { useCallback, useEffect, useRef, useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/server/actions";
import {
  actionResultErrorMessage,
  safeServerAction,
} from "@/lib/action-errors";
import { unlockIdleDocument } from "@/components/overlay-root";
import { setFlashToast } from "@/lib/flash-toast";
import { preventDismissWhilePending } from "@/hooks/prevent-dismiss";

export { preventDismissWhilePending };

type ServerAction = (
  prev: ActionResult | null,
  formData: FormData,
) => Promise<ActionResult>;

type NotifyOptions = {
  /**
   * Almost every caller already renders its own inline `<FormError>` right
   * next to the field that failed — toasting the same message on top of
   * that showed the identical error twice (a sonner toast in the corner
   * *and* the inline red box). Off by default for that reason; the rare
   * caller with no inline error display of its own (the footer newsletter
   * signup, the admin Messages mark-read/remove buttons) opts back in.
   */
  toastErrors?: boolean;
};

/**
 * Apply toast / redirect as soon as the server action returns — before React
 * re-renders from revalidation. If we wait for a useEffect, the form can
 * already be unmounted (e.g. remove walk → not-found on the same URL, or
 * cancel walk → Cancel button swapped for Reopen), and the toast/redirect
 * never runs.
 */
function notifyActionResult(result: ActionResult, onOk?: () => void, toastErrors = false) {
  if (result.ok) {
    onOk?.();
    unlockIdleDocument();
    if (result.href) {
      setFlashToast({
        type: "success",
        message: result.message ?? "Saved.",
      });
      window.location.assign(result.href);
      return;
    }
    toast.success(result.message ?? "Saved.");
    return;
  }
  if (toastErrors) toast.error(actionResultErrorMessage(result.error));
}

/**
 * useActionState + immediate notify. Prefer this over useActionToast whenever
 * success may remove this component from the tree (delete, cancel/reopen swap,
 * redirect-away).
 */
export function useNotifyActionState(action: ServerAction, onOk?: () => void, options?: NotifyOptions) {
  const router = useRouter();
  const onOkRef = useRef(onOk);
  const actionRef = useRef(action);
  const toastErrors = options?.toastErrors ?? false;
  useEffect(() => {
    onOkRef.current = onOk;
    actionRef.current = action;
  });

  const wrapped = useCallback(async (prev: ActionResult | null, formData: FormData) => {
    const result = await safeServerAction((p, data) => actionRef.current(p, data))(prev, formData);
    // Refresh before onOk so closing a drawer/form does not cancel the refresh.
    if (result.ok && !result.href) {
      router.refresh();
    }
    notifyActionResult(result, () => onOkRef.current?.(), toastErrors);
    return result;
  }, [router, toastErrors]);

  return useActionState<ActionResult | null, FormData>(wrapped, null);
}

/**
 * Shared "toast the result, then refresh" for forms that stay mounted after
 * success. Do not use when success unmounts this component — use
 * useNotifyActionState instead (effect never runs if we are gone).
 */
export function useActionToast(state: ActionResult | null, onOk?: () => void, options?: NotifyOptions) {
  const router = useRouter();
  const onOkRef = useRef(onOk);
  const toastErrors = options?.toastErrors ?? false;

  useEffect(() => {
    onOkRef.current = onOk;
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      unlockIdleDocument();
      if (state.href) {
        const href = state.href;
        setFlashToast({
          type: "success",
          message: state.message ?? "Saved.",
        });
        unlockIdleDocument();
        window.location.assign(href);
        return;
      }
      toast.success(state.message ?? "Saved.");
      // Refresh before onOk — if onOk unmounts this form, a deferred refresh
      // would be cleaned up and sibling lists would stay stale.
      router.refresh();
      onOkRef.current?.();
      return;
    }
    if (toastErrors) toast.error(actionResultErrorMessage(state.error));
  }, [router, state, toastErrors]);
}
