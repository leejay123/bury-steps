"use client";

import { useCallback, useEffect, useRef, useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/server/actions";
import { unlockIdleDocument } from "@/components/overlay-root";
import { setFlashToast } from "@/lib/flash-toast";
import { preventDismissWhilePending } from "@/hooks/prevent-dismiss";

export { preventDismissWhilePending };

type ServerAction = (
  prev: ActionResult | null,
  formData: FormData,
) => Promise<ActionResult>;

/**
 * Apply toast / redirect as soon as the server action returns — before React
 * re-renders from revalidation. If we wait for a useEffect, the form can
 * already be unmounted (e.g. remove walk → not-found on the same URL, or
 * cancel walk → Cancel button swapped for Reopen), and the toast/redirect
 * never runs.
 */
export function notifyActionResult(result: ActionResult, onOk?: () => void) {
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
  toast.error(result.error);
}

/**
 * useActionState + immediate notify. Prefer this over useActionToast whenever
 * success may remove this component from the tree (delete, cancel/reopen swap,
 * redirect-away).
 */
export function useNotifyActionState(action: ServerAction, onOk?: () => void) {
  const router = useRouter();
  const onOkRef = useRef(onOk);
  onOkRef.current = onOk;
  const actionRef = useRef(action);
  actionRef.current = action;

  const wrapped = useCallback(async (prev: ActionResult | null, formData: FormData) => {
    const result = await actionRef.current(prev, formData);
    notifyActionResult(result, () => onOkRef.current?.());
    if (result.ok && !result.href) {
      // Server already revalidated; refresh so siblings that stayed mounted update.
      queueMicrotask(() => router.refresh());
    }
    return result;
  }, [router]);

  return useActionState<ActionResult | null, FormData>(wrapped, null);
}

/**
 * Shared "toast the result, then refresh" for forms that stay mounted after
 * success. Do not use when success unmounts this component — use
 * useNotifyActionState instead (effect never runs if we are gone).
 */
export function useActionToast(state: ActionResult | null, onOk?: () => void) {
  const router = useRouter();
  const onOkRef = useRef(onOk);
  onOkRef.current = onOk;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      onOkRef.current?.();
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
      const id = window.setTimeout(() => router.refresh(), 0);
      return () => window.clearTimeout(id);
    }
    toast.error(state.error);
  }, [router, state]);
}
