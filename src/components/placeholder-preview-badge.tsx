"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { SEARCH_COOKIE } from "@/lib/remembered-nav";
import {
  readPlaceholderPreview,
  setPlaceholderPreview,
  type PlaceholderPreviewMode,
} from "@/lib/placeholder-preview-cookie";

const noopSubscribe = () => () => {};
const NEXT: Record<"off" | PlaceholderPreviewMode, PlaceholderPreviewMode | null> = {
  off: "hold",
  hold: "always",
  always: null,
};
const LABEL = { off: "Off", hold: "Hold 5s", always: "Always" } as const;

/** Owners only (the header's owner-only search cookie marks them in this browser). */
function readIsOwner(): boolean {
  try {
    return new RegExp(`(?:^|; )${SEARCH_COOKIE}=1(?:;|$)`).test(document.cookie);
  } catch {
    return false;
  }
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

/**
 * Quick on/off for "Preview loading placeholders" (Settings → Site
 * behaviour), for owners: a small pill on every page and Alt+P (Option+P on
 * a Mac) both cycle Off → Hold 5s → Always. This browser only.
 */
export function PlaceholderPreviewBadge() {
  const router = useRouter();
  const owner = useSyncExternalStore(noopSubscribe, readIsOwner, () => false);
  const saved = useSyncExternalStore(noopSubscribe, readPlaceholderPreview, () => null);
  const [override, setOverride] = useState<PlaceholderPreviewMode | "off" | null>(null);
  const mode = override ?? saved ?? "off";

  const cycle = useCallback(() => {
    const next = NEXT[mode];
    setPlaceholderPreview(next);
    setOverride(next ?? "off");
    router.refresh();
  }, [mode, router]);

  useEffect(() => {
    if (!owner) return;
    const onKey = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.code !== "KeyP" || isTyping(event.target)) return;
      event.preventDefault();
      cycle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [owner, cycle]);

  if (!owner) return null;
  const on = mode !== "off";
  return (
    <button
      aria-label={`Placeholder preview: ${LABEL[mode]}. Change (Alt+P)`}
      className={`fixed bottom-[calc(1rem+var(--bottom-nav-offset,0px))] left-4 z-[60] flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs shadow-md ${
        on ? "bg-foreground text-background" : "bg-background text-muted-foreground"
      }`}
      onClick={cycle}
      title="Alt+P (Option+P on a Mac)"
      type="button"
    >
      Placeholders: <span className="font-medium">{LABEL[mode]}</span>
    </button>
  );
}
