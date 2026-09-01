/** Open the signed-in member bell drawer (optional notice to scroll to). */
export const OPEN_MEMBER_NOTICE_BELL_EVENT = "bury-steps:open-member-notice-bell";

export function openMemberNoticeBell(noticeId?: string) {
  window.dispatchEvent(
    new CustomEvent(OPEN_MEMBER_NOTICE_BELL_EVENT, { detail: { noticeId } }),
  );
}

export type OpenMemberNoticeBellDetail = { noticeId?: string };
