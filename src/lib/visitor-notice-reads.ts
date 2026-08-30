/** localStorage key for which notice ids a visitor has marked read. */
export const VISITOR_NOTICE_READS_KEY = "bury-steps-visitor-notice-reads";

export function readVisitorNoticeReads(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VISITOR_NOTICE_READS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export function writeVisitorNoticeReads(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VISITOR_NOTICE_READS_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    // Quota / private mode — ignore; unread badges may return.
  }
}

export function markVisitorNoticeRead(noticeId: string) {
  const next = readVisitorNoticeReads();
  if (!next.includes(noticeId)) next.push(noticeId);
  writeVisitorNoticeReads(next);
  return next;
}

export function markVisitorNoticesRead(noticeIds: string[]) {
  const next = [...new Set([...readVisitorNoticeReads(), ...noticeIds])];
  writeVisitorNoticeReads(next);
  return next;
}
