/**
 * Barrel re-export. The actual server actions live in `./actions/*.ts`,
 * split by domain (walks, journey, attendance, members, homepage content,
 * notices, site settings, reports, admin cache) — this file exists so every
 * existing `import { x } from "@/server/actions"` keeps working unchanged.
 */

export type { ActionResult } from "./actions/shared";

export {
  createWalk,
  duplicateWalk,
  searchWalkPlaces,
  cancelWalk,
  reopenWalk,
  updateWalk,
  deleteWalk,
  setWalkRetentionLocked,
  endWalkEarly,
} from "./actions/walks";
// Not a server action — a plain constant used by both endWalkEarly and the
// End walk dialog. Lives in @/lib/walk-window (see there for why), not in
// the "use server" file, which may only export async functions.
export { END_WALK_MINUTES_AGO_OPTIONS } from "@/lib/walk-window";

export { createJourneyEvent, updateJourneyEvent, deleteJourneyEvent } from "./actions/journey";

export {
  clockIn,
  searchAddableMembers,
  adminClockIn,
  adminRemoveAttendance,
  clockOut,
} from "./actions/attendance";

export {
  deleteMember,
  setMemberRole,
  setOrganiserPermissions,
  transferOwnership,
  getMemberHistory,
  searchMembers,
  resendOrganiserInvite,
  cancelOrganiserInvite,
  acceptOrganiserInvite,
  type MemberHistoryItem,
  type MemberRow,
  type MemberRoleFilter,
  type MemberSort,
} from "./actions/members";

export {
  addHomepageSlide,
  replaceHomepageSlideImage,
  deleteHomepageSlide,
  reorderHomepageSlides,
} from "./actions/homepage-slides";

export {
  addHomepageTestimonial,
  updateHomepageTestimonial,
  deleteHomepageTestimonial,
  reorderHomepageTestimonials,
} from "./actions/homepage-testimonials";

export {
  addHomepageFaq,
  updateHomepageFaq,
  deleteHomepageFaq,
  reorderHomepageFaqs,
  addHomepageFaqCategory,
  updateHomepageFaqCategory,
  deleteHomepageFaqCategory,
  reorderHomepageFaqCategories,
} from "./actions/homepage-faqs";

export {
  addSiteNotice,
  updateSiteNotice,
  deleteSiteNotice,
  setSiteNoticeEnabled,
  markSiteNoticesRead,
  markSiteNoticeRead,
  addSiteNoticeCategory,
  updateSiteNoticeCategory,
  deleteSiteNoticeCategory,
  reorderSiteNoticeCategories,
} from "./actions/notices";

export {
  updateCarouselEnabled,
  updateAccidentReportRetentionDays,
  updateCancelledWalkRetentionDays,
  updateContactMessagesOwner,
  updateOrganiserInviteRequired,
  updateScrollToTopEnabled,
  updateCookieConsentVariant,
  updateSiteBranding,
  updateFacebookGroupUrl,
  reorderHomepageSections,
  updateFaqSectionCopy,
  updateTestimonialsSectionCopy,
  updateHowThisStartedCopy,
  updateAboutLists,
  updateMonthlyClockInGoal,
  updateSiteLogo,
  updateSiteFavicon,
  updateReportBanner,
} from "./actions/site-settings";

export {
  addAccidentReport,
  updateAccidentReport,
  deleteAccidentReport,
  setAccidentReportRetentionLocked,
  getWalkAttendeesForReportForm,
} from "./actions/reports";

export { clearSiteCache, resetSiteToDefault } from "./actions/admin-cache";

export { startImpersonation } from "./actions/impersonation";

export {
  submitContactMessage,
  markContactMessageRead,
  deleteContactMessage,
} from "./actions/contact";

export {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  sendNewsletterCampaign,
  removeNewsletterSubscriber,
} from "./actions/newsletter";

export {
  updateMemberEmailPreferences,
  updateMyEmailPreferences,
} from "./actions/email-preferences";

export {
  getEmailTemplateOverrides,
  updateEmailTemplate,
  resetEmailTemplate,
  sendTestEmailTemplate,
} from "./actions/email-templates";
