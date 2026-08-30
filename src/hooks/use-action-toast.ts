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
        // Hard navigation after the overlay unlock timers (0 / 250ms) so a
        // stuck alert dialog cannot leave pointer-events locked on the next
        // page. Soft router.push raced that teardown and froze Duplicate.
        const id = window.setTimeout(() => {
          unlockIdleDocument();
          window.location.assign(href);
        }, 300);
        return () => window.clearTimeout(id);
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
