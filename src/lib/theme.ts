/**
 * `primaryColor` is still stored on `SiteSetting` (a required column) and
 * defaulted here when other settings actions upsert that row. The admin UI
 * that used to let an organiser change it was removed as dead code — nothing
 * in the app renders a colour picker for it any more — so this file now only
 * keeps the constants those upserts still need.
 */
export const SITE_SETTING_ID = "site";
export const DEFAULT_PRIMARY_COLOR = "#111111";
