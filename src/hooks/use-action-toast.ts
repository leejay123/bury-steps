"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/server/actions";

/**
 * Shared "toast the result, then refresh the page's server data" pattern
 * used by every admin manager (FAQs, slides, testimonials, notices,
 * reports) after an add/edit `useActionState` action settles. Centralising
 * it means the `router.refresh()` call can't be silently dropped again when
 * a new manager is copied from an existing one.
 */
export function useActionToast(state: ActionResult | null, onOk?: () => void) {
  const router = useRouter();
  const onOkRef = useRef(onOk);
  onOkRef.current = onOk;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      onOkRef.current?.();
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [router, state]);
}
