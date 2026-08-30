"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/server/actions";
import { unlockIdleDocument } from "@/components/overlay-root";

/**
 * Shared "toast the result, then refresh the page's server data" pattern
 * used by every admin manager (FAQs, slides, testimonials, notices,
 * reports) after an add/edit `useActionState` action settles. Centralising
 * it means the `router.refresh()` call can't be silently dropped again when
 * a new manager is copied from an existing one.
 *
 * Close the dialog first, then toast, then refresh on the next tick. A
 * refresh in the same turn as the success state can leave `useFormStatus`
 * pending, and Radix then treats our `setOpen(false)` as a dismiss-during-
 * save and opens the dialog again.
 *
 * Navigating away: never `router.push` / `router.replace` inside `onOk`.
 * Return `href` on the ActionResult instead. Soft navigation in `onOk`
 * races the success toast (and can freeze overlays). This hook toasts first,
 * then hard-assigns after a short delay when `href` is set.
 */
export function useActionToast(state: ActionResult | null, onOk?: () => void) {
  const router = useRouter();
  const onOkRef = useRef(onOk);
  onOkRef.current = onOk;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      onOkRef.current?.();
      toast.success(state.message ?? "Saved.");
      unlockIdleDocument();
      if (state.href) {
        const href = state.href;
        // Leave the current page immediately when the action says so (e.g.
        // Remove walk). Waiting even briefly lets Next refresh the deleted
        // walk URL and flash the not-found page before we navigate.
        unlockIdleDocument();
        window.location.assign(href);
        return;
      }
      const id = window.setTimeout(() => router.refresh(), 0);
      return () => window.clearTimeout(id);
    }
    toast.error(state.error);
  }, [router, state]);
}

/**
 * Block X / Escape / overlay dismiss while a save is in flight, without
 * reopening the dialog after a successful close (`setOpen(false)` still
 * fires Radix `onOpenChange(false)` while pending can be true).
 */
export function preventDismissWhilePending(
  isPending: boolean,
  setOpen: (open: boolean) => void,
  onClose?: () => void,
) {
  return (next: boolean) => {
    if (isPending && !next) return;
    setOpen(next);
    if (!next) onClose?.();
  };
}
