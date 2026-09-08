"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markSiteNoticeRead } from "@/server/actions";

/**
 * Marks this notice read as soon as its page is viewed, then refreshes the
 * router so the bell's unread count updates in the browser tab that's
 * currently open. Previously this ran server-side via `after()` +
 * `revalidatePath` on the page itself — that invalidates the cache for the
 * *next* navigation, but never tells an already-rendered header to refetch,
 * so the badge stayed stale until some unrelated navigation happened to
 * pick it up. Mirrors how the bell drawer itself marks a notice read.
 */
export function MarkNoticeReadOnView({ noticeId }: { noticeId: string }) {
  const router = useRouter();
  const sentFor = useRef<string | null>(null);

  useEffect(() => {
    if (sentFor.current === noticeId) return;
    sentFor.current = noticeId;
    markSiteNoticeRead(noticeId)
      .then((result) => {
        if (result.ok) router.refresh();
      })
      .catch(() => {
        // Best-effort read receipt — not worth surfacing a toast for.
      });
  }, [noticeId, router]);

  return null;
}
