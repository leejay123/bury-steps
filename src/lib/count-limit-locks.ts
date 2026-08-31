/**
 * Postgres advisory-lock keys for count/role races. Distinct bigints only —
 * keep in sync with any raw `pg_advisory_xact_lock` callers. Avoid 847291
 * (syncLocalUser bootstrap).
 */
export const COUNT_LIMIT_LOCK_KEYS = {
  homepageSlide: 900101,
  homepageTestimonial: 900102,
  homepageFaq: 900103,
  homepageFaqCategory: 900104,
  siteNotice: 900105,
  siteNoticeCategory: 900106,
  lastAdmin: 900107,
  journeyEvent: 900108,
} as const;
