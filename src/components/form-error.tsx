"use client";

import { useEffect, useRef } from "react";
import { CircleAlert } from "lucide-react";

/**
 * Server action errors were toast-only: a message that appears for a couple
 * of seconds and then is gone, with no trace left in the form itself. That's
 * invisible to anyone who missed the toast — including screen reader users,
 * since a `sonner` toast isn't reliably announced the way an in-page
 * `role="alert"` region is. This renders the same message inline, next to
 * the form it belongs to, and keeps it up for as long as the error stands.
 *
 * Compact by design — the page-level Alert component is too roomy for short
 * validation copy inside drawers and dialogs.
 */
export function FormError({ message }: { message?: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  // In a long form (Create walk) this sits below the fold, so pressing the
  // button seemed to do nothing. Bring it into view when it appears.
  useEffect(() => {
    if (!message) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [message]);

  if (!message) return null;
  return (
    <div
      className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
      ref={ref}
      role="alert"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 flex-1 leading-snug">{message}</p>
    </div>
  );
}
