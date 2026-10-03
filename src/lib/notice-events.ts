/**
 * Browser-only signals for "a notice was read", so the bell and the
 * Notices dots update straight away without refetching the page (which
 * used to throw away every page the browser had remembered).
 */

/** Sent when a notice is read on its own page. detail: the notice id. */
export const NOTICE_READ_EVENT = "bury:notice-read";
/** Sent by the bell whenever its unread count changes. detail: the count. */
export const NOTICES_UNREAD_EVENT = "bury:notices-unread";
