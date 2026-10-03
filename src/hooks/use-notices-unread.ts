import { useEffect, useState } from "react";
import { NOTICES_UNREAD_EVENT } from "@/lib/notice-events";

/**
 * Whether to show a "new" dot on Notices: what the server said when the
 * page loaded, then whatever the bell reports as notices get read in this
 * tab — so the dot clears straight away, without refreshing the page.
 */
export function useNoticesUnread(fromServer: boolean): boolean {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const onCount = (event: Event) => setCount((event as CustomEvent<number>).detail);
    window.addEventListener(NOTICES_UNREAD_EVENT, onCount);
    return () => window.removeEventListener(NOTICES_UNREAD_EVENT, onCount);
  }, []);
  return count === null ? fromServer : count > 0;
}
