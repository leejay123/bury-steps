"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { readPlaceholderPreview, setPlaceholderPreview } from "@/lib/placeholder-preview-cookie";

const noopSubscribe = () => () => {};

/** A reminder, on every page, while placeholder preview is on in this browser — with a way out. */
export function PlaceholderPreviewBadge() {
  const router = useRouter();
  const on = useSyncExternalStore(noopSubscribe, readPlaceholderPreview, () => false);
  const [dismissed, setDismissed] = useState(false);
  if (!on || dismissed) return null;
  return (
    <div className="fixed bottom-[calc(1rem+var(--bottom-nav-offset,0px))] left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full border bg-background px-4 py-2 text-sm shadow-lg">
      <span>Placeholder preview is on</span>
      <button
        className="font-medium underline underline-offset-4"
        onClick={() => {
          setPlaceholderPreview(false);
          setDismissed(true);
          router.refresh();
        }}
        type="button"
      >
        Turn off
      </button>
    </div>
  );
}
