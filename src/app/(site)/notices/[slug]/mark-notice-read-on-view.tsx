"use client";

import { useEffect, useRef } from "react";
import { NOTICE_READ_EVENT, markNoticesReadInThisTab } from "@/lib/notice-events";
import { markSiteNoticeRead } from "@/server/actions";

/**
 * Marks this notice read as soon as its page is viewed, then tells the
 * bell (and the Notices dots) in this tab so the unread count drops at
 * once. It used to refresh the whole page for that, which also made the
 * browser forget every page it had remembered — so going back to Notices
 * always reloaded with placeholders.
 */
export function MarkNoticeReadOnView({ noticeId }: { noticeId: string }) {
  const sentFor = useRef<string | null>(null);

  useEffect(() => {
    if (sentFor.current === noticeId) return;
    sentFor.current = noticeId;
    markSiteNoticeRead(noticeId)
      .then((result) => {
        if (!result.ok) return;
        markNoticesReadInThisTab([noticeId]);
        window.dispatchEvent(new CustomEvent(NOTICE_READ_EVENT, { detail: noticeId }));
      })
      .catch(() => {
        // Best-effort read receipt — not worth surfacing a toast for.
      });
  }, [noticeId]);

  return null;
}
