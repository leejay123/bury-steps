/**
 * Browser-only signals for "a notice was read", so the bell and the
 * Notices dots update straight away without refetching the page (which
 * used to throw away every page the browser had remembered).
 */

/** Sent when a notice is read on its own page. detail: the notice id. */
export const NOTICE_READ_EVENT = "bury:notice-read";
/** Sent by the bell whenever its unread count changes. detail: the count. */
export const NOTICES_UNREAD_EVENT = "bury:notices-unread";

/**
 * Notices read in this tab since it was opened. A page kept from earlier
 * (going Back to Notices — Next keeps recent pages alive but hidden) was
 * rendered before they were read, so it checks this as well as the unread
 * list it came with. A tiny store, so such a page re-renders when it's
 * shown again (see useSyncExternalStore in NoticesBlogSection).
 */
const readInThisTab = new Set<string>();
let readVersion = 0;
const readListeners = new Set<() => void>();

export function markNoticesReadInThisTab(ids: Iterable<string>): void {
  for (const id of ids) readInThisTab.add(id);
  readVersion += 1;
  for (const listener of readListeners) listener();
}

export function isNoticeReadInThisTab(id: string): boolean {
  return readInThisTab.has(id);
}

export function subscribeNoticesRead(listener: () => void): () => void {
  readListeners.add(listener);
  return () => readListeners.delete(listener);
}

export function noticesReadVersion(): number {
  return readVersion;
}
