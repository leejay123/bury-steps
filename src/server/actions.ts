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
} from "./actions/walks";

export { createJourneyEvent, updateJourneyEvent, deleteJourneyEvent } from "./actions/journey";

export { createRoute, updateRoute, deleteRoute, setWalkRoute } from "./actions/routes";

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
  getMemberHistory,
  type MemberHistoryItem,
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

export { addAccidentReport, updateAccidentReport, deleteAccidentReport } from "./actions/reports";

export { clearSiteCache, resetSiteToDefault } from "./actions/admin-cache";

export {
  submitContactMessage,
  markContactMessageRead,
  deleteContactMessage,
} from "./actions/contact";
