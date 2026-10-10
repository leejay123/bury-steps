"use server";

import { z } from "zod";
import { parseWalkPageSections, serializeWalkPageSections } from "@/lib/walk-page-sections";
import { guardArgs, guardForm } from "@/lib/safe-action";

import { parsePageTransition } from "@/lib/page-transition";
import { serializeAnnouncementPages } from "@/lib/announcement-pages";
import { parseTextSize } from "@/lib/text-sizes";
import { revalidatePath, revalidateTag } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { actorStillOwner } from "@/lib/site-owner";
import {
  parseTestimonialsSectionEyebrow,
  parseTestimonialsSectionIntro,
  parseTestimonialsSectionTitle,
} from "@/lib/testimonials";
import { parseFaqSectionIntro, parseFaqSectionTitle } from "@/lib/faqs";
import {
  parseHomepageSectionOrder,
  serializeHomepageSectionOrder,
  type HomepageSectionId,
} from "@/lib/homepage-sections";
import {
  MAX_ABOUT_LIST_ITEM,
  MAX_ABOUT_LIST_ITEMS,
  MAX_ABOUT_RULES,
  MAX_ABOUT_SECTION_HEADING,
  parseAboutList,
  parseAboutRules,
  parseAboutSectionHeading,
  parseHowThisStartedBody,
  parseHowThisStartedEyebrow,
  parseHowThisStartedTeaser,
  parseHowThisStartedTitle,
  serializeAboutList,
  serializeAboutRules,
} from "@/lib/homepage-copy";
import { SITE_SETTING_ID, DEFAULT_PRIMARY_COLOR } from "@/lib/theme";
import { parseSiteFont } from "@/lib/site-font";
import {
  HERO_VIDEO_OPTIONS,
  parseHeroOverlayOpacity,
  parseHeroStyle,
  parseSliderHeroWords,
  parseHeroTextColor,
  parseHeroVideoKey,
} from "@/lib/hero-style";
import {
  SECTION_BG_COLUMNS,
  SECTION_BG_KEYS,
  parseSectionBgPattern,
  type SectionBgKey,
} from "@/lib/section-background";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-cache";
import { CONTACT_MESSAGES_OWNER_TAG } from "@/lib/contact-messages-owner";
import {
  DEFAULT_COOKIE_CONSENT_VARIANT,
  parseCookieConsentVariant,
} from "@/lib/cookie-consent-variant";
import { parseFacebookGroupUrl, parseSiteName, parseSiteTagline } from "@/lib/site-branding";
import { MAX_MONTHLY_CLOCK_IN_GOAL } from "@/lib/walk-game";
import { MAX_RETENTION_DAYS, parseRetentionDays } from "@/lib/walk-retention";
import { readImageDimensions } from "@/lib/image-dimensions";
import { MAX_WALK_ESSENTIALS, parseEssentialList } from "@/lib/walk-essentials";
import {
  type ActionResult,
  logActionError,
  ownerDenied,
  permissionDenied,
  readOptionalImage,
  revalidateHomepage,
} from "./shared";

async function updateCarouselEnabledWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const enabled = String(formData.get("carouselEnabled") ?? "") === "on";

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: enabled,
      },
      update: { carouselEnabled: enabled },
    });
  } catch (err) {
    return logActionError("updateCarouselEnabled", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/hero-photos");
  return { ok: true, message: enabled ? "You have turned the carousel on." : "You have turned the carousel off." };
}

/** Homepage hero style: the usual light hero, or a full-bleed video hero
 * (see HeroCinematic) using one of the bundled HERO_VIDEO_OPTIONS. */
async function updateHeroStyleWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");

  const heroStyle = parseHeroStyle(String(formData.get("heroStyle") ?? ""));
  const rawVideoKey = String(formData.get("heroVideoKey") ?? "");
  if (heroStyle === "cinematic" && !HERO_VIDEO_OPTIONS.some((option) => option.key === rawVideoKey)) {
    return { ok: false, error: "Choose a video." };
  }
  const heroVideoKey = parseHeroVideoKey(rawVideoKey);
  const heroOverlayOpacity = parseHeroOverlayOpacity(Number(formData.get("heroOverlayOpacity")));
  const heroTextColor = parseHeroTextColor(String(formData.get("heroTextColor") ?? ""));

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        heroStyle,
        heroVideoKey,
        heroOverlayOpacity,
        heroTextColor,
      },
      update: { heroStyle, heroVideoKey, heroOverlayOpacity, heroTextColor },
    });
  } catch (err) {
    return logActionError("updateHeroStyle", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/hero-photos");
  return {
    ok: true,
    message:
      heroStyle === "cinematic"
        ? "Switched the homepage to the video hero."
        : heroStyle === "globe"
          ? "Switched the homepage to the globe hero."
          : heroStyle === "parallax"
            ? "Switched the homepage to the parallax hero."
            : heroStyle === "marquee"
              ? "Switched the homepage to the 3D marquee hero."
              : heroStyle === "slider"
                ? "Switched the homepage to the photo slider hero."
                : heroStyle === "default"
                  ? "Switched the homepage to the default hero."
                  : "Switched the homepage hero.",
  };
}

/** Background pattern (none/dots/stripes — see src/lib/section-background.ts)
 * behind one homepage section. One action for all five sections: which
 * SiteSetting column it writes depends on `section`. */
async function updateSectionBgPatternWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");

  const section = String(formData.get("section") ?? "") as SectionBgKey;
  if (!SECTION_BG_KEYS.includes(section)) {
    return { ok: false, error: "Unknown section." };
  }
  const pattern = parseSectionBgPattern(String(formData.get("pattern") ?? ""));
  const column = SECTION_BG_COLUMNS[section];

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: { id: SITE_SETTING_ID, primaryColor: DEFAULT_PRIMARY_COLOR, [column]: pattern },
      update: { [column]: pattern },
    });
  } catch (err) {
    return logActionError("updateSectionBgPattern", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Background pattern updated." };
}

/** Site-wide switch for the homepage's "Latest notices" section — off
 * hides it for every signed-in member, even when there are notices they'd
 * otherwise see there (see SiteTheme.memberNoticesEnabled). */
async function updateMemberNoticesEnabledWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const enabled = String(formData.get("memberNoticesEnabled") ?? "") === "on";

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        memberNoticesEnabled: enabled,
      },
      update: { memberNoticesEnabled: enabled },
    });
  } catch (err) {
    return logActionError("updateMemberNoticesEnabled", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/homepage-layout");
  return {
    ok: true,
    message: enabled
      ? "Latest notices will show on the homepage again."
      : "Latest notices is now hidden from the homepage.",
  };
}

/** Site-wide switch for /progress (see getProgressEnabled) — off 404s the
 * page for everyone, organisers included, not just members. */
async function updateProgressEnabledWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const enabled = String(formData.get("progressEnabled") ?? "") === "on";

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        progressEnabled: enabled,
      },
      update: { progressEnabled: enabled },
    });
  } catch (err) {
    return logActionError("updateProgressEnabled", err, "Could not save that setting. Try again.");
  }

  // Not homepage-tagged (Progress isn't part of the homepage) — just the
  // nav (every page, via the root layout) and Progress itself.
  revalidatePath("/", "layout");
  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/progress");
  revalidatePath("/admin/settings");
  return {
    ok: true,
    message: enabled ? "Progress is back on for everyone." : "Progress is now off for everyone.",
  };
}

/** Toggles whether promoting a member to organiser sends an invite email
 * (taking effect only once accepted) instead of promoting immediately. */
async function updateOrganiserInviteRequiredWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const enabled = String(formData.get("organiserInviteRequired") ?? "") === "on";

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        organiserInviteRequired: enabled,
      },
      update: { organiserInviteRequired: enabled },
    });
  } catch (err) {
    return logActionError(
      "updateOrganiserInviteRequired",
      err,
      "Could not save that setting. Try again.",
    );
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/behaviour");
  return {
    ok: true,
    message: enabled
      ? "Promoting a member now sends them an invite to accept first."
      : "Promoting a member now takes effect immediately again.",
  };
}

/** Toggles whether clock-in requires an emergency contact name and phone. */
async function updateEmergencyContactRequiredWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const enabled = String(formData.get("emergencyContactRequired") ?? "") === "on";

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        emergencyContactRequired: enabled,
      },
      update: { emergencyContactRequired: enabled },
    });
  } catch (err) {
    return logActionError(
      "updateEmergencyContactRequired",
      err,
      "Could not save that setting. Try again.",
    );
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/behaviour");
  return {
    ok: true,
    message: enabled
      ? "Members now need an emergency contact before they can clock in."
      : "An emergency contact is optional at clock-in again.",
  };
}

/** Days a cancelled, unreopened walk is kept before the daily cron deletes
 * it — blank turns auto-delete off. A flagged (retentionLocked) walk is
 * kept regardless of this setting; see the walk's own page. */
async function updateCancelledWalkRetentionDaysWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  // Same gate as the Data retention settings page (permCacheReset) — not
  // Display. An organiser with branding access alone must not change
  // auto-delete windows.
  if (!admin.permCacheReset) return permissionDenied("permCacheReset");
  if (!(await actorStillOwner(admin.id))) return ownerDenied("change cancelled-walk retention");
  const parsed = parseRetentionDays(String(formData.get("cancelledWalkRetentionDays") ?? ""));
  if (parsed === "invalid") {
    return {
      ok: false,
      error: `Enter a whole number of days from 1 to ${MAX_RETENTION_DAYS.toLocaleString("en-GB")}, or leave it blank to turn auto-delete off.`,
    };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        cancelledWalkRetentionDays: parsed,
      },
      update: { cancelledWalkRetentionDays: parsed },
    });
  } catch (err) {
    return logActionError(
      "updateCancelledWalkRetentionDays",
      err,
      "Could not save that setting. Try again.",
    );
  }

  revalidatePath("/walks");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/retention");
  revalidatePath("/admin/guide");
  return {
    ok: true,
    message: parsed
      ? `Cancelled walks are deleted automatically after ${parsed.toLocaleString("en-GB")} ${parsed === 1 ? "day" : "days"}.`
      : "Cancelled walks are no longer deleted automatically.",
  };
}

/** Days an accident report is kept (from when it was logged) before the
 * daily cron deletes it — blank (the default) turns auto-delete off. A
 * flagged (retentionLocked) report is kept regardless; see the report
 * itself in Reports. */
async function updateAccidentReportRetentionDaysWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  // Same gate as the Data retention settings page (permCacheReset) — not
  // Display. An organiser with branding access alone must not change
  // auto-delete windows.
  if (!admin.permCacheReset) return permissionDenied("permCacheReset");
  if (!(await actorStillOwner(admin.id))) return ownerDenied("change accident-report retention");
  const parsed = parseRetentionDays(String(formData.get("accidentReportRetentionDays") ?? ""));
  if (parsed === "invalid") {
    return {
      ok: false,
      error: `Enter a whole number of days from 1 to ${MAX_RETENTION_DAYS.toLocaleString("en-GB")}, or leave it blank to turn auto-delete off.`,
    };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        accidentReportRetentionDays: parsed,
      },
      update: { accidentReportRetentionDays: parsed },
    });
  } catch (err) {
    return logActionError(
      "updateAccidentReportRetentionDays",
      err,
      "Could not save that setting. Try again.",
    );
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/retention");
  revalidatePath("/admin/guide");
  return {
    ok: true,
    message: parsed
      ? `Accident reports are deleted automatically ${parsed.toLocaleString("en-GB")} ${parsed === 1 ? "day" : "days"} after they're logged.`
      : "Accident reports are no longer deleted automatically.",
  };
}

/** Sets the single organiser who gets contact-form alert emails and is
 * expected to reply (via the alert email's reply-to). Pass an empty string
 * to designate no one. */
async function updateContactMessagesOwnerWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const userId = String(formData.get("contactMessagesOwnerId") ?? "").trim();

  let owner: { firstName: string | null; lastName: string | null; email: string; role: string } | null =
    null;
  if (userId) {
    owner = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true, role: true },
    });
    if (!owner || owner.role !== "ADMIN") {
      return { ok: false, error: "Choose a current organiser." };
    }
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        contactMessagesOwnerId: userId || null,
      },
      update: { contactMessagesOwnerId: userId || null },
    });
  } catch (err) {
    return logActionError(
      "updateContactMessagesOwner",
      err,
      "Could not save that setting. Try again.",
    );
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/behaviour");
  revalidatePath("/admin/messages");
  revalidateTag(CONTACT_MESSAGES_OWNER_TAG, { expire: 0 });
  return {
    ok: true,
    message: owner
      ? `Contact form alerts now go to ${[owner.firstName, owner.lastName].filter(Boolean).join(" ").trim() || owner.email}.`
      : "No one will be alerted about new contact form messages.",
  };
}

async function updateScrollToTopEnabledWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const enabled = String(formData.get("scrollToTopEnabled") ?? "") === "on";

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: enabled,
      },
      update: { scrollToTopEnabled: enabled },
    });
  } catch (err) {
    return logActionError("updateScrollToTopEnabled", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/behaviour");
  return { ok: true, message: enabled ? "Back to top is on." : "Back to top is off." };
}

/** Links the announcement bar may point at: a page on this site ("/walks")
 * or a full https:// address. Anything else is refused rather than guessed. */
function parseAnnouncementLink(raw: string): string | null {
  const link = raw.trim();
  if (!link) return "";
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  try {
    const url = new URL(link);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function updateAnnouncementBannerWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const enabled = String(formData.get("announcementEnabled") ?? "") === "on";
  const text = String(formData.get("announcementText") ?? "").trim();
  const link = parseAnnouncementLink(String(formData.get("announcementLink") ?? ""));
  const pages = serializeAnnouncementPages(
    String(formData.get("announcementScope") ?? "all"),
    String(formData.get("announcementPaths") ?? ""),
  );
  if (text.length > 160) return { ok: false, error: "Keep the announcement to 160 characters or fewer." };
  if (enabled && !text) return { ok: false, error: "Write the announcement before turning it on." };
  if (link === null) {
    return { ok: false, error: "The link must be a page on this site (like /walks) or start with https://." };
  }
  if (pages === null) {
    return { ok: false, error: "List the pages to show it on, separated by commas — for example /walks, /notices." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        announcementEnabled: enabled,
        announcementText: text,
        announcementLink: link,
        announcementPages: pages,
      },
      update: { announcementEnabled: enabled, announcementText: text, announcementLink: link, announcementPages: pages },
    });
  } catch (err) {
    return logActionError("updateAnnouncementBanner", err, "Could not save the announcement. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/behaviour");
  return { ok: true, message: enabled ? "Announcement is showing." : "Announcement saved and hidden." };
}

async function updateMobileNavWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const style = String(formData.get("mobileNav") ?? "") === "menu" ? "menu" : "bottom";

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: { id: SITE_SETTING_ID, primaryColor: DEFAULT_PRIMARY_COLOR, carouselEnabled: true, mobileNav: style },
      update: { mobileNav: style },
    });
  } catch (err) {
    return logActionError("updateMobileNav", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/behaviour");
  return {
    ok: true,
    message: style === "menu" ? "Phones now use the ☰ menu." : "Phones now use the bottom bar.",
  };
}

async function updatePageTransitionWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const mode = parsePageTransition(String(formData.get("pageTransition") ?? ""));

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: { id: SITE_SETTING_ID, primaryColor: DEFAULT_PRIMARY_COLOR, carouselEnabled: true, pageTransition: mode },
      update: { pageTransition: mode },
    });
  } catch (err) {
    return logActionError("updatePageTransition", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/behaviour");
  return {
    ok: true,
    message:
      mode === "fade"
        ? "Pages now fade in."
        : mode === "slide"
          ? "Pages now slide in and out when you open something and go back."
          : mode === "rise"
            ? "Pages now rise into place, like the walk cards."
          : "Page changes are now instant.",
  };
}

async function updateSliderHeroWordsWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const words = parseSliderHeroWords(String(formData.get("sliderHeroWords") ?? ""));

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: { id: SITE_SETTING_ID, primaryColor: DEFAULT_PRIMARY_COLOR, carouselEnabled: true, sliderHeroWords: words },
      update: { sliderHeroWords: words },
    });
  } catch (err) {
    return logActionError("updateSliderHeroWords", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/homepage-layout");
  return {
    ok: true,
    message:
      words === "site"
        ? "The site name now shows on every photo."
        : words === "slides"
          ? "Each photo now shows its own words."
          : "The photos now show without words.",
  };
}

async function updateTitleRevealEnabledWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const enabled = String(formData.get("titleRevealEnabled") ?? "") === "on";

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: { id: SITE_SETTING_ID, primaryColor: DEFAULT_PRIMARY_COLOR, carouselEnabled: true, titleRevealEnabled: enabled },
      update: { titleRevealEnabled: enabled },
    });
  } catch (err) {
    return logActionError("updateTitleRevealEnabled", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/homepage-layout");
  return { ok: true, message: enabled ? "Section titles now animate in." : "Section titles are plain again." };
}

async function updateFooterWordmarkMobileWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const enabled = String(formData.get("footerWordmarkMobile") ?? "") === "on";

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: { id: SITE_SETTING_ID, primaryColor: DEFAULT_PRIMARY_COLOR, carouselEnabled: true, footerWordmarkMobile: enabled },
      update: { footerWordmarkMobile: enabled },
    });
  } catch (err) {
    return logActionError("updateFooterWordmarkMobile", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/behaviour");
  return { ok: true, message: enabled ? "Footer name shows on phones too." : "Footer name is hidden on phones." };
}

async function updateFooterWordmarkEnabledWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const enabled = String(formData.get("footerWordmarkEnabled") ?? "") === "on";

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        footerWordmarkEnabled: enabled,
      },
      update: { footerWordmarkEnabled: enabled },
    });
  } catch (err) {
    return logActionError("updateFooterWordmarkEnabled", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/behaviour");
  return { ok: true, message: enabled ? "Footer name is on." : "Footer name is off." };
}

async function updateSiteFontWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const font = parseSiteFont(String(formData.get("siteFont") ?? ""));
  if (!font) {
    return { ok: false, error: "Choose a site font." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        siteFont: font,
      },
      update: { siteFont: font },
    });
  } catch (err) {
    return logActionError("updateSiteFont", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/branding");
  return { ok: true, message: "Site font saved. The whole website is using it now." };
}

async function updateTextSizesWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const headline = parseTextSize("headline", formData.get("headline"));
  const section = parseTextSize("section", formData.get("section"));
  const intro = parseTextSize("intro", formData.get("intro"));
  const body = parseTextSize("body", formData.get("body"));
  if (headline === null || section === null || intro === null || body === null) {
    return { ok: false, error: "Choose a size for each option." };
  }
  const sizes = { textHeadlinePx: headline, textSectionPx: section, textIntroPx: intro, textBodyPx: body };

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        ...sizes,
      },
      update: sizes,
    });
  } catch (err) {
    return logActionError("updateTextSizes", err, "Could not save text sizes. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/branding");
  return { ok: true, message: "Text sizes saved. The whole website is using them now." };
}

async function updateCookieConsentVariantWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const variant = parseCookieConsentVariant(String(formData.get("cookieConsentVariant") ?? ""));
  if (!variant) {
    return { ok: false, error: "Choose a cookie notice layout." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: variant,
      },
      update: { cookieConsentVariant: variant },
    });
  } catch (err) {
    return logActionError("updateCookieConsentVariant", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/behaviour");
  return {
    ok: true,
    message:
      variant === "default"
        ? "Cookie notice set to the full layout."
        : variant === "mini"
          ? "Cookie notice set to the mini layout."
          : "Cookie notice set to the compact layout.",
  };
}

async function updateSiteBrandingWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const siteName = parseSiteName(String(formData.get("siteName") ?? ""));
  const siteTagline = parseSiteTagline(String(formData.get("siteTagline") ?? ""));
  if (siteName === "invalid") {
    return { ok: false, error: "Give the site a name of 2–80 characters." };
  }
  if (siteTagline === "invalid") {
    return { ok: false, error: "Give a short tagline of 8–220 characters." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        siteName,
        siteTagline,
      },
      update: { siteName, siteTagline },
    });
  } catch (err) {
    return logActionError("updateSiteBranding", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/branding");
  return { ok: true, message: "Site name and tagline saved." };
}

async function updateFacebookGroupUrlWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const facebookGroupUrl = parseFacebookGroupUrl(String(formData.get("facebookGroupUrl") ?? ""));
  if (facebookGroupUrl === "invalid") {
    return {
      ok: false,
      error: "Enter a full https Facebook group link, or leave it blank to hide the link.",
    };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        facebookGroupUrl,
      },
      update: { facebookGroupUrl },
    });
  } catch (err) {
    return logActionError("updateFacebookGroupUrl", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/branding");
  return {
    ok: true,
    message: facebookGroupUrl
      ? "Facebook group link saved."
      : "Facebook group link hidden.",
  };
}

async function reorderHomepageSectionsWork(ids: HomepageSectionId[]): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const order = parseHomepageSectionOrder(serializeHomepageSectionOrder(ids));
  if (order === "invalid") {
    return { ok: false, error: "Could not save that order. Try again." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        homepageSectionOrder: serializeHomepageSectionOrder(order),
      },
      update: { homepageSectionOrder: serializeHomepageSectionOrder(order) },
    });
  } catch (err) {
    return logActionError("reorderHomepageSections", err, "Could not save that order. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/homepage-layout");
  return { ok: true, message: "Homepage section order saved." };
}

async function updateFaqSectionCopyWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const faqSectionTitle = parseFaqSectionTitle(String(formData.get("faqSectionTitle") ?? ""));
  const faqSectionIntro = parseFaqSectionIntro(String(formData.get("faqSectionIntro") ?? ""));
  if (faqSectionTitle === "invalid") {
    return { ok: false, error: "Give the FAQs a heading of 2–80 characters." };
  }
  if (faqSectionIntro === "invalid") {
    return { ok: false, error: "Give a short intro of 8–280 characters." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        faqSectionTitle,
        faqSectionIntro,
      },
      update: { faqSectionTitle, faqSectionIntro },
    });
  } catch (err) {
    return logActionError("updateFaqSectionCopy", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/site-wording/faqs");
  return { ok: true, message: "FAQ heading and intro saved." };
}

async function updateTestimonialsSectionCopyWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const testimonialsSectionEyebrow = parseTestimonialsSectionEyebrow(
    String(formData.get("testimonialsSectionEyebrow") ?? ""),
  );
  const testimonialsSectionTitle = parseTestimonialsSectionTitle(
    String(formData.get("testimonialsSectionTitle") ?? ""),
  );
  const testimonialsSectionIntro = parseTestimonialsSectionIntro(
    String(formData.get("testimonialsSectionIntro") ?? ""),
  );
  if (testimonialsSectionEyebrow === "invalid") {
    return { ok: false, error: "Keep the eyebrow under 80 characters, or leave it blank." };
  }
  if (testimonialsSectionTitle === "invalid") {
    return { ok: false, error: "Give testimonials a heading of 2–80 characters." };
  }
  if (testimonialsSectionIntro === "invalid") {
    return { ok: false, error: "Give a short intro of 8–280 characters." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        testimonialsSectionEyebrow,
        testimonialsSectionTitle,
        testimonialsSectionIntro,
      },
      update: { testimonialsSectionEyebrow, testimonialsSectionTitle, testimonialsSectionIntro },
    });
  } catch (err) {
    return logActionError(
      "updateTestimonialsSectionCopy",
      err,
      "Could not save that setting. Try again.",
    );
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/site-wording/testimonials");
  return { ok: true, message: "Testimonials heading and intro saved." };
}

async function updateHowThisStartedCopyWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const howThisStartedTitle = parseHowThisStartedTitle(
    String(formData.get("howThisStartedTitle") ?? ""),
  );
  const howThisStartedEyebrow = parseHowThisStartedEyebrow(
    String(formData.get("howThisStartedEyebrow") ?? ""),
  );
  const howThisStartedTeaser = parseHowThisStartedTeaser(
    String(formData.get("howThisStartedTeaser") ?? ""),
  );
  const howThisStartedBody = parseHowThisStartedBody(
    String(formData.get("howThisStartedBody") ?? ""),
  );
  if (howThisStartedTitle === "invalid") {
    return { ok: false, error: "Give How this started a heading of 2–80 characters." };
  }
  if (howThisStartedEyebrow === "invalid") {
    return { ok: false, error: "Keep the eyebrow under 80 characters, or leave it blank." };
  }
  if (howThisStartedTeaser === "invalid") {
    return { ok: false, error: "Give a short homepage blurb of 8–400 characters." };
  }
  if (howThisStartedBody === "invalid") {
    return { ok: false, error: "Give the full story at least 40 characters (up to 12,000)." };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        howThisStartedTitle,
        howThisStartedEyebrow,
        howThisStartedTeaser,
        howThisStartedBody,
      },
      update: {
        howThisStartedTitle,
        howThisStartedEyebrow,
        howThisStartedTeaser,
        howThisStartedBody,
      },
    });
  } catch (err) {
    return logActionError(
      "updateHowThisStartedCopy",
      err,
      "Could not save that setting. Try again.",
    );
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/site-wording/how-this-started");
  return { ok: true, message: "How this started copy saved." };
}

async function updateAboutListsWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const aboutGoals = parseAboutList(String(formData.get("aboutGoals") ?? ""));
  const aboutPlaces = parseAboutList(String(formData.get("aboutPlaces") ?? ""));
  const aboutExpect = parseAboutList(String(formData.get("aboutExpect") ?? ""));
  const aboutRules = parseAboutRules(String(formData.get("aboutRules") ?? ""));
  const aboutGoalsHeading = parseAboutSectionHeading(String(formData.get("aboutGoalsHeading") ?? ""));
  const aboutPlacesHeading = parseAboutSectionHeading(
    String(formData.get("aboutPlacesHeading") ?? ""),
  );
  const aboutExpectHeading = parseAboutSectionHeading(
    String(formData.get("aboutExpectHeading") ?? ""),
  );
  const aboutRulesHeading = parseAboutSectionHeading(
    String(formData.get("aboutRulesHeading") ?? ""),
  );
  if (aboutGoals === "invalid") {
    return {
      ok: false,
      error: `Goals need 1–${MAX_ABOUT_LIST_ITEMS} lines, each up to ${MAX_ABOUT_LIST_ITEM} characters.`,
    };
  }
  if (aboutPlaces === "invalid") {
    return {
      ok: false,
      error: `Places need 1–${MAX_ABOUT_LIST_ITEMS} lines, each up to ${MAX_ABOUT_LIST_ITEM} characters.`,
    };
  }
  if (aboutExpect === "invalid") {
    return {
      ok: false,
      error: `“What you can expect” needs 1–${MAX_ABOUT_LIST_ITEMS} lines, each up to ${MAX_ABOUT_LIST_ITEM} characters.`,
    };
  }
  if (aboutRules === "invalid") {
    return {
      ok: false,
      error: `Rules need 1–${MAX_ABOUT_RULES} lines as “Title | Body”.`,
    };
  }
  if (
    aboutGoalsHeading === "invalid" ||
    aboutPlacesHeading === "invalid" ||
    aboutExpectHeading === "invalid" ||
    aboutRulesHeading === "invalid"
  ) {
    return { ok: false, error: `Give each heading 2–${MAX_ABOUT_SECTION_HEADING} characters.` };
  }

  const aboutGoalsText = serializeAboutList(aboutGoals);
  const aboutPlacesText = serializeAboutList(aboutPlaces);
  const aboutExpectText = serializeAboutList(aboutExpect);
  const aboutRulesText = serializeAboutRules(aboutRules);

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        aboutGoals: aboutGoalsText,
        aboutPlaces: aboutPlacesText,
        aboutExpect: aboutExpectText,
        aboutRules: aboutRulesText,
        aboutGoalsHeading,
        aboutPlacesHeading,
        aboutExpectHeading,
        aboutRulesHeading,
      },
      update: {
        aboutGoals: aboutGoalsText,
        aboutPlaces: aboutPlacesText,
        aboutExpect: aboutExpectText,
        aboutRules: aboutRulesText,
        aboutGoalsHeading,
        aboutPlacesHeading,
        aboutExpectHeading,
        aboutRulesHeading,
      },
    });
  } catch (err) {
    return logActionError("updateAboutLists", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/site-wording/about-lists");
  return { ok: true, message: "About lists saved." };
}

/** Show or hide one of the two cards on a walk's own page. */
async function updateWalkPageCardEnabled(
  column: "beforeYouSetOffEnabled" | "howWalksWorkEnabled",
  formKey: string,
  formData: FormData,
  copy: { on: string; off: string },
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const enabled = String(formData.get(formKey) ?? "") === "on";

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        [column]: enabled,
      },
      update: { [column]: enabled },
    });
  } catch (err) {
    return logActionError("updateWalkPageCardEnabled", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/site-wording/walk-page-cards");
  return { ok: true, message: enabled ? copy.on : copy.off };
}

async function updateBeforeYouSetOffEnabledWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return updateWalkPageCardEnabled("beforeYouSetOffEnabled", "beforeYouSetOffEnabled", formData, {
    on: "Before you set off will show on walk pages again.",
    off: "Before you set off is now hidden on walk pages.",
  });
}

async function updateHowWalksWorkEnabledWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return updateWalkPageCardEnabled("howWalksWorkEnabled", "howWalksWorkEnabled", formData, {
    on: "How this group works will show on walk pages again.",
    off: "How this group works is now hidden on walk pages.",
  });
}

/** The walk-page "Before you set off" and "How this group works" cards —
 * same list/rule format as the About lists above, so it reuses their
 * parse/serialize helpers. */
async function updateWalkPageCopyWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");

  const tips = parseAboutList(String(formData.get("beforeYouSetOffTips") ?? ""));
  const steps = parseAboutRules(String(formData.get("howWalksWorkSteps") ?? ""));
  if (tips === "invalid") {
    return {
      ok: false,
      error: `"Before you set off" needs 1–${MAX_ABOUT_LIST_ITEMS} lines, each up to ${MAX_ABOUT_LIST_ITEM} characters.`,
    };
  }
  if (steps === "invalid") {
    return {
      ok: false,
      error: `"How this group works" needs 1–${MAX_ABOUT_RULES} lines as "Title | Body".`,
    };
  }

  const tipsText = serializeAboutList(tips);
  const stepsText = serializeAboutRules(steps);

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        scrollToTopEnabled: true,
        cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
        beforeYouSetOffTips: tipsText,
        howWalksWorkSteps: stepsText,
      },
      update: {
        beforeYouSetOffTips: tipsText,
        howWalksWorkSteps: stepsText,
      },
    });
  } catch (err) {
    return logActionError("updateWalkPageCopy", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/site-wording/walk-page-cards");
  return { ok: true, message: "Walk page copy saved." };
}

function parseMonthlyClockInGoal(raw: string): number | null | "invalid" {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) return "invalid";
  const n = Number(trimmed);
  if (n === 0) return null;
  if (n > MAX_MONTHLY_CLOCK_IN_GOAL) return "invalid";
  return n;
}

async function updateMonthlyClockInGoalWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permProgress) return permissionDenied("permProgress");
  const parsed = parseMonthlyClockInGoal(String(formData.get("monthlyClockInGoal") ?? ""));
  if (parsed === "invalid") {
    return {
      ok: false,
      error: `Enter a whole number from 1 to ${MAX_MONTHLY_CLOCK_IN_GOAL.toLocaleString("en-GB")}, or leave it blank.`,
    };
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        monthlyClockInGoal: parsed,
      },
      update: { monthlyClockInGoal: parsed },
    });
  } catch (err) {
    return logActionError("updateMonthlyClockInGoal", err, "Could not save that setting. Try again.");
  }

  revalidatePath("/progress");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/progress");
  return {
    ok: true,
    message: parsed
      ? `Together goal is ${parsed.toLocaleString("en-GB")} ${parsed === 1 ? "clock-in" : "clock-ins"} this month.`
      : "Together goal is off.",
  };
}

async function updateSiteLogoWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const image = await readOptionalImage(formData);
  if (image && "error" in image) return { ok: false, error: image.error };
  const removing = !image && formData.get("removeImage") === "on";
  if (!image && !removing) return { ok: false, error: "Choose a logo to upload." };

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        ...(image ? { logoMime: image.mime, logoData: image.data, logoBlur: image.blur } : {}),
      },
      update: image
        ? { logoMime: image.mime, logoData: image.data, logoBlur: image.blur }
        : { logoMime: null, logoData: null, logoBlur: null },
    });
  } catch (err) {
    return logActionError("updateSiteLogo", err, "Could not save that logo. Try again.");
  }

  revalidateHomepage();
  revalidatePath("/", "layout");
  return { ok: true, message: removing ? "Back to the default logo." : "Logo updated." };
}

async function updateSiteFaviconWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const image = await readOptionalImage(formData);
  if (image && "error" in image) return { ok: false, error: image.error };
  const removing = !image && formData.get("removeImage") === "on";
  if (!image && !removing) return { ok: false, error: "Choose a favicon to upload." };

  // A favicon that isn't square gets squashed or cropped unpredictably by
  // different browsers — reject it here rather than letting a banner-shaped
  // logo photo end up as the browser tab icon. Dimensions that can't be read
  // are rejected too, rather than assumed to be fine.
  if (image) {
    const dims = readImageDimensions(image.data, image.mime);
    if (!dims || dims.width !== dims.height) {
      return { ok: false, error: "Favicon must be a square image — equal width and height." };
    }
  }

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        ...(image ? { faviconMime: image.mime, faviconData: image.data } : {}),
      },
      update: image
        ? { faviconMime: image.mime, faviconData: image.data }
        : { faviconMime: null, faviconData: null },
    });
  } catch (err) {
    return logActionError("updateSiteFavicon", err, "Could not save that favicon. Try again.");
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    message: removing
      ? "Back to the default favicon."
      : "Favicon updated. Some browsers cache tab icons — a hard refresh may be needed to see it.",
  };
}

async function updateReportBannerWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const image = await readOptionalImage(formData);
  if (image && "error" in image) return { ok: false, error: image.error };
  const removing = !image && formData.get("removeImage") === "on";
  if (!image && !removing) return { ok: false, error: "Choose a banner to upload." };

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        carouselEnabled: true,
        ...(image
          ? { reportBannerMime: image.mime, reportBannerData: image.data, reportBannerBlur: image.blur }
          : {}),
      },
      update: image
        ? { reportBannerMime: image.mime, reportBannerData: image.data, reportBannerBlur: image.blur }
        : { reportBannerMime: null, reportBannerData: null, reportBannerBlur: null },
    });
  } catch (err) {
    return logActionError("updateReportBanner", err, "Could not save that banner. Try again.");
  }

  revalidatePath("/admin/reports");
  return {
    ok: true,
    message: removing ? "Report banner removed." : "Report banner updated.",
  };
}

/**
 * Settings → Walk essentials: the whole tick-box list at once, as JSON
 * [{ key, label, icon }]. Removing an item takes it off every walk's page;
 * walks keep the key, so putting it back brings their ticks back too.
 */
async function updateWalkEssentialsWork(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permWalksEdit) return permissionDenied("permWalksEdit");

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { ok: false, error: "Could not read the list. Try again." };
  }
  if (!Array.isArray(raw)) return { ok: false, error: "Could not read the list. Try again." };
  if (raw.length > MAX_WALK_ESSENTIALS) {
    return { ok: false, error: `Keep the list to ${MAX_WALK_ESSENTIALS} items or fewer.` };
  }
  if (raw.some((item) => !item || typeof item.label !== "string" || !item.label.trim())) {
    return { ok: false, error: "Give every item a name, or remove it." };
  }
  const items = parseEssentialList(raw);

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: { id: SITE_SETTING_ID, primaryColor: DEFAULT_PRIMARY_COLOR, carouselEnabled: true, walkEssentials: items },
      update: { walkEssentials: items },
    });
  } catch (err) {
    return logActionError("updateWalkEssentials", err, "Could not save the list. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return { ok: true, message: "Walk essentials saved." };
}

const pass = z.object({});
const readPass = (_formData: FormData) => ({});

function readStrings<const K extends string>(
  formData: FormData,
  keys: readonly K[],
): { [P in K]: string } {
  const out = {} as { [P in K]: string };
  for (const key of keys) out[key] = String(formData.get(key) ?? "");
  return out;
}

function reject(ctx: z.RefinementCtx, path: string, message: string) {
  ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: [path] });
}

const heroStyleSchema = z
  .object({ heroStyle: z.string(), heroVideoKey: z.string() })
  .superRefine((value, ctx) => {
    const heroStyle = parseHeroStyle(value.heroStyle);
    if (heroStyle === "cinematic" && !HERO_VIDEO_OPTIONS.some((option) => option.key === value.heroVideoKey)) {
      reject(ctx, "heroVideoKey", "Choose a video.");
    }
  });

const sectionBgSchema = z.object({
  section: z.string().refine(
    (section): section is SectionBgKey => SECTION_BG_KEYS.includes(section as SectionBgKey),
    "Unknown section.",
  ),
});

const retentionMessage = `Enter a whole number of days from 1 to ${MAX_RETENTION_DAYS.toLocaleString("en-GB")}, or leave it blank to turn auto-delete off.`;

const cancelledRetentionSchema = z
  .object({ cancelledWalkRetentionDays: z.string() })
  .superRefine((value, ctx) => {
    if (parseRetentionDays(value.cancelledWalkRetentionDays) === "invalid") {
      reject(ctx, "cancelledWalkRetentionDays", retentionMessage);
    }
  });

const accidentRetentionSchema = z
  .object({ accidentReportRetentionDays: z.string() })
  .superRefine((value, ctx) => {
    if (parseRetentionDays(value.accidentReportRetentionDays) === "invalid") {
      reject(ctx, "accidentReportRetentionDays", retentionMessage);
    }
  });

const announcementSchema = z
  .object({
    announcementEnabled: z.string(),
    announcementText: z.string(),
    announcementLink: z.string(),
    announcementScope: z.string(),
    announcementPaths: z.string(),
  })
  .superRefine((value, ctx) => {
    const enabled = value.announcementEnabled === "on";
    const text = value.announcementText.trim();
    const link = parseAnnouncementLink(value.announcementLink);
    const pages = serializeAnnouncementPages(value.announcementScope, value.announcementPaths);
    if (text.length > 160) {
      reject(ctx, "announcementText", "Keep the announcement to 160 characters or fewer.");
      return;
    }
    if (enabled && !text) {
      reject(ctx, "announcementText", "Write the announcement before turning it on.");
      return;
    }
    if (link === null) {
      reject(
        ctx,
        "announcementLink",
        "The link must be a page on this site (like /walks) or start with https://.",
      );
      return;
    }
    if (pages === null) {
      reject(
        ctx,
        "announcementPaths",
        "List the pages to show it on, separated by commas — for example /walks, /notices.",
      );
    }
  });

function readAnnouncement(formData: FormData) {
  return {
    announcementEnabled: String(formData.get("announcementEnabled") ?? ""),
    announcementText: String(formData.get("announcementText") ?? ""),
    announcementLink: String(formData.get("announcementLink") ?? ""),
    announcementScope: String(formData.get("announcementScope") ?? "all"),
    announcementPaths: String(formData.get("announcementPaths") ?? ""),
  };
}

const siteFontSchema = z.object({
  siteFont: z.string().refine((value) => parseSiteFont(value) !== null, "Choose a site font."),
});

const textSizesSchema = z
  .object({
    headline: z.string(),
    section: z.string(),
    intro: z.string(),
    body: z.string(),
  })
  .superRefine((value, ctx) => {
    if (
      parseTextSize("headline", value.headline) === null ||
      parseTextSize("section", value.section) === null ||
      parseTextSize("intro", value.intro) === null ||
      parseTextSize("body", value.body) === null
    ) {
      reject(ctx, "headline", "Choose a size for each option.");
    }
  });

const cookieSchema = z.object({
  cookieConsentVariant: z
    .string()
    .refine((value) => parseCookieConsentVariant(value) !== null, "Choose a cookie notice layout."),
});

const siteBrandingSchema = z
  .object({ siteName: z.string(), siteTagline: z.string() })
  .superRefine((value, ctx) => {
    if (parseSiteName(value.siteName) === "invalid") {
      reject(ctx, "siteName", "Give the site a name of 2–80 characters.");
      return;
    }
    if (parseSiteTagline(value.siteTagline) === "invalid") {
      reject(ctx, "siteTagline", "Give a short tagline of 8–220 characters.");
    }
  });

const facebookSchema = z
  .object({ facebookGroupUrl: z.string() })
  .superRefine((value, ctx) => {
    if (parseFacebookGroupUrl(value.facebookGroupUrl) === "invalid") {
      reject(
        ctx,
        "facebookGroupUrl",
        "Enter a full https Facebook group link, or leave it blank to hide the link.",
      );
    }
  });

const reorderIdsSchema = z
  .array(z.string().min(1, "Could not save that order. Try again."))
  .min(1, "Could not save that order. Try again.");

const faqSectionSchema = z
  .object({ faqSectionTitle: z.string(), faqSectionIntro: z.string() })
  .superRefine((value, ctx) => {
    if (parseFaqSectionTitle(value.faqSectionTitle) === "invalid") {
      reject(ctx, "faqSectionTitle", "Give the FAQs a heading of 2–80 characters.");
      return;
    }
    if (parseFaqSectionIntro(value.faqSectionIntro) === "invalid") {
      reject(ctx, "faqSectionIntro", "Give a short intro of 8–280 characters.");
    }
  });

const testimonialsSectionSchema = z
  .object({
    testimonialsSectionEyebrow: z.string(),
    testimonialsSectionTitle: z.string(),
    testimonialsSectionIntro: z.string(),
  })
  .superRefine((value, ctx) => {
    if (parseTestimonialsSectionEyebrow(value.testimonialsSectionEyebrow) === "invalid") {
      reject(ctx, "testimonialsSectionEyebrow", "Keep the eyebrow under 80 characters, or leave it blank.");
      return;
    }
    if (parseTestimonialsSectionTitle(value.testimonialsSectionTitle) === "invalid") {
      reject(ctx, "testimonialsSectionTitle", "Give testimonials a heading of 2–80 characters.");
      return;
    }
    if (parseTestimonialsSectionIntro(value.testimonialsSectionIntro) === "invalid") {
      reject(ctx, "testimonialsSectionIntro", "Give a short intro of 8–280 characters.");
    }
  });

const howThisStartedSchema = z
  .object({
    howThisStartedTitle: z.string(),
    howThisStartedEyebrow: z.string(),
    howThisStartedTeaser: z.string(),
    howThisStartedBody: z.string(),
  })
  .superRefine((value, ctx) => {
    if (parseHowThisStartedTitle(value.howThisStartedTitle) === "invalid") {
      reject(ctx, "howThisStartedTitle", "Give How this started a heading of 2–80 characters.");
      return;
    }
    if (parseHowThisStartedEyebrow(value.howThisStartedEyebrow) === "invalid") {
      reject(ctx, "howThisStartedEyebrow", "Keep the eyebrow under 80 characters, or leave it blank.");
      return;
    }
    if (parseHowThisStartedTeaser(value.howThisStartedTeaser) === "invalid") {
      reject(ctx, "howThisStartedTeaser", "Give a short homepage blurb of 8–400 characters.");
      return;
    }
    if (parseHowThisStartedBody(value.howThisStartedBody) === "invalid") {
      reject(ctx, "howThisStartedBody", "Give the full story at least 40 characters (up to 12,000).");
    }
  });

const aboutListsSchema = z
  .object({
    aboutGoals: z.string(),
    aboutPlaces: z.string(),
    aboutExpect: z.string(),
    aboutRules: z.string(),
    aboutGoalsHeading: z.string(),
    aboutPlacesHeading: z.string(),
    aboutExpectHeading: z.string(),
    aboutRulesHeading: z.string(),
  })
  .superRefine((value, ctx) => {
    if (parseAboutList(value.aboutGoals) === "invalid") {
      reject(
        ctx,
        "aboutGoals",
        `Goals need 1–${MAX_ABOUT_LIST_ITEMS} lines, each up to ${MAX_ABOUT_LIST_ITEM} characters.`,
      );
      return;
    }
    if (parseAboutList(value.aboutPlaces) === "invalid") {
      reject(
        ctx,
        "aboutPlaces",
        `Places need 1–${MAX_ABOUT_LIST_ITEMS} lines, each up to ${MAX_ABOUT_LIST_ITEM} characters.`,
      );
      return;
    }
    if (parseAboutList(value.aboutExpect) === "invalid") {
      reject(
        ctx,
        "aboutExpect",
        `“What you can expect” needs 1–${MAX_ABOUT_LIST_ITEMS} lines, each up to ${MAX_ABOUT_LIST_ITEM} characters.`,
      );
      return;
    }
    if (parseAboutRules(value.aboutRules) === "invalid") {
      reject(ctx, "aboutRules", `Rules need 1–${MAX_ABOUT_RULES} lines as “Title | Body”.`);
      return;
    }
    if (
      parseAboutSectionHeading(value.aboutGoalsHeading) === "invalid" ||
      parseAboutSectionHeading(value.aboutPlacesHeading) === "invalid" ||
      parseAboutSectionHeading(value.aboutExpectHeading) === "invalid" ||
      parseAboutSectionHeading(value.aboutRulesHeading) === "invalid"
    ) {
      reject(ctx, "aboutGoalsHeading", `Give each heading 2–${MAX_ABOUT_SECTION_HEADING} characters.`);
    }
  });

const walkPageCopySchema = z
  .object({
    beforeYouSetOffTips: z.string(),
    howWalksWorkSteps: z.string(),
  })
  .superRefine((value, ctx) => {
    if (parseAboutList(value.beforeYouSetOffTips) === "invalid") {
      reject(
        ctx,
        "beforeYouSetOffTips",
        `"Before you set off" needs 1–${MAX_ABOUT_LIST_ITEMS} lines, each up to ${MAX_ABOUT_LIST_ITEM} characters.`,
      );
      return;
    }
    if (parseAboutRules(value.howWalksWorkSteps) === "invalid") {
      reject(
        ctx,
        "howWalksWorkSteps",
        `"How this group works" needs 1–${MAX_ABOUT_RULES} lines as "Title | Body".`,
      );
    }
  });

const monthlyGoalSchema = z
  .object({ monthlyClockInGoal: z.string() })
  .superRefine((value, ctx) => {
    if (parseMonthlyClockInGoal(value.monthlyClockInGoal) === "invalid") {
      reject(
        ctx,
        "monthlyClockInGoal",
        `Enter a whole number from 1 to ${MAX_MONTHLY_CLOCK_IN_GOAL.toLocaleString("en-GB")}, or leave it blank.`,
      );
    }
  });

const walkEssentialsSchema = z
  .object({ items: z.string() })
  .superRefine((value, ctx) => {
    let raw: unknown;
    try {
      raw = JSON.parse(value.items || "[]");
    } catch {
      reject(ctx, "items", "Could not read the list. Try again.");
      return;
    }
    if (!Array.isArray(raw)) {
      reject(ctx, "items", "Could not read the list. Try again.");
      return;
    }
    if (raw.length > MAX_WALK_ESSENTIALS) {
      reject(ctx, "items", `Keep the list to ${MAX_WALK_ESSENTIALS} items or fewer.`);
      return;
    }
    if (raw.some((item) => !item || typeof item.label !== "string" || !item.label.trim())) {
      reject(ctx, "items", "Give every item a name, or remove it.");
    }
  });

function readWalkEssentials(formData: FormData) {
  return { items: String(formData.get("items") ?? "[]") };
}

const reorderHomepageSectionsGuarded = guardArgs(
  "organiser",
  reorderIdsSchema,
  (ids) => reorderHomepageSectionsWork(ids as HomepageSectionId[]),
);

export const updateCarouselEnabled = guardForm("organiser", pass, readPass, updateCarouselEnabledWork);
export const updateHeroStyle = guardForm(
  "organiser",
  heroStyleSchema,
  (formData) => readStrings(formData, ["heroStyle", "heroVideoKey"] as const),
  updateHeroStyleWork,
);
export const updateSectionBgPattern = guardForm(
  "organiser",
  sectionBgSchema,
  (formData) => readStrings(formData, ["section"] as const),
  updateSectionBgPatternWork,
);
export const updateMemberNoticesEnabled = guardForm("organiser", pass, readPass, updateMemberNoticesEnabledWork);
export const updateProgressEnabled = guardForm("organiser", pass, readPass, updateProgressEnabledWork);
export const updateOrganiserInviteRequired = guardForm(
  "organiser",
  pass,
  readPass,
  updateOrganiserInviteRequiredWork,
);
export const updateEmergencyContactRequired = guardForm(
  "organiser",
  pass,
  readPass,
  updateEmergencyContactRequiredWork,
);
export const updateCancelledWalkRetentionDays = guardForm(
  "organiser",
  cancelledRetentionSchema,
  (formData) => readStrings(formData, ["cancelledWalkRetentionDays"] as const),
  updateCancelledWalkRetentionDaysWork,
);
export const updateAccidentReportRetentionDays = guardForm(
  "organiser",
  accidentRetentionSchema,
  (formData) => readStrings(formData, ["accidentReportRetentionDays"] as const),
  updateAccidentReportRetentionDaysWork,
);
export const updateContactMessagesOwner = guardForm("organiser", pass, readPass, updateContactMessagesOwnerWork);
export const updateScrollToTopEnabled = guardForm("organiser", pass, readPass, updateScrollToTopEnabledWork);
export const updateAnnouncementBanner = guardForm(
  "organiser",
  announcementSchema,
  readAnnouncement,
  updateAnnouncementBannerWork,
);
export const updateMobileNav = guardForm("organiser", pass, readPass, updateMobileNavWork);
export const updatePageTransition = guardForm("organiser", pass, readPass, updatePageTransitionWork);
export const updateSliderHeroWords = guardForm("organiser", pass, readPass, updateSliderHeroWordsWork);
export const updateTitleRevealEnabled = guardForm("organiser", pass, readPass, updateTitleRevealEnabledWork);
export const updateFooterWordmarkMobile = guardForm("organiser", pass, readPass, updateFooterWordmarkMobileWork);
export const updateFooterWordmarkEnabled = guardForm("organiser", pass, readPass, updateFooterWordmarkEnabledWork);
export const updateSiteFont = guardForm(
  "organiser",
  siteFontSchema,
  (formData) => readStrings(formData, ["siteFont"] as const),
  updateSiteFontWork,
);
export const updateTextSizes = guardForm(
  "organiser",
  textSizesSchema,
  (formData) => readStrings(formData, ["headline", "section", "intro", "body"] as const),
  updateTextSizesWork,
);
export const updateCookieConsentVariant = guardForm(
  "organiser",
  cookieSchema,
  (formData) => readStrings(formData, ["cookieConsentVariant"] as const),
  updateCookieConsentVariantWork,
);
export const updateSiteBranding = guardForm(
  "organiser",
  siteBrandingSchema,
  (formData) => readStrings(formData, ["siteName", "siteTagline"] as const),
  updateSiteBrandingWork,
);
export const updateFacebookGroupUrl = guardForm(
  "organiser",
  facebookSchema,
  (formData) => readStrings(formData, ["facebookGroupUrl"] as const),
  updateFacebookGroupUrlWork,
);
export async function reorderHomepageSections(ids: HomepageSectionId[]): Promise<ActionResult> {
  return reorderHomepageSectionsGuarded(ids);
}

/** Walk pages: the order and show/hide of the shared sections (walk-page-sections.ts). */
async function saveWalkPageSectionsWork(value: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permDisplay) return permissionDenied("permDisplay");
  const sections = parseWalkPageSections(value);
  const text = serializeWalkPageSections(sections);
  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: { id: SITE_SETTING_ID, primaryColor: DEFAULT_PRIMARY_COLOR, walkPageSections: text },
      update: { walkPageSections: text },
    });
  } catch (err) {
    return logActionError("saveWalkPageSections", err, "Could not save the walk page layout. Try again.");
  }
  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/site-wording/walk-page-cards");
  return { ok: true, message: "Walk page layout saved." };
}
const saveWalkPageSectionsGuarded = guardArgs(
  "organiser",
  z.string().max(200, "Could not save the walk page layout. Try again."),
  (value) => saveWalkPageSectionsWork(value as string),
);
export async function saveWalkPageSections(value: string): Promise<ActionResult> {
  return saveWalkPageSectionsGuarded(value);
}
export const updateFaqSectionCopy = guardForm(
  "organiser",
  faqSectionSchema,
  (formData) => readStrings(formData, ["faqSectionTitle", "faqSectionIntro"] as const),
  updateFaqSectionCopyWork,
);
export const updateTestimonialsSectionCopy = guardForm(
  "organiser",
  testimonialsSectionSchema,
  (formData) =>
    readStrings(formData, [
      "testimonialsSectionEyebrow",
      "testimonialsSectionTitle",
      "testimonialsSectionIntro",
    ] as const),
  updateTestimonialsSectionCopyWork,
);
export const updateHowThisStartedCopy = guardForm(
  "organiser",
  howThisStartedSchema,
  (formData) =>
    readStrings(formData, [
      "howThisStartedTitle",
      "howThisStartedEyebrow",
      "howThisStartedTeaser",
      "howThisStartedBody",
    ] as const),
  updateHowThisStartedCopyWork,
);
export const updateAboutLists = guardForm(
  "organiser",
  aboutListsSchema,
  (formData) =>
    readStrings(formData, [
      "aboutGoals",
      "aboutPlaces",
      "aboutExpect",
      "aboutRules",
      "aboutGoalsHeading",
      "aboutPlacesHeading",
      "aboutExpectHeading",
      "aboutRulesHeading",
    ] as const),
  updateAboutListsWork,
);
export const updateBeforeYouSetOffEnabled = guardForm("organiser", pass, readPass, updateBeforeYouSetOffEnabledWork);
export const updateHowWalksWorkEnabled = guardForm("organiser", pass, readPass, updateHowWalksWorkEnabledWork);
export const updateWalkPageCopy = guardForm(
  "organiser",
  walkPageCopySchema,
  (formData) => readStrings(formData, ["beforeYouSetOffTips", "howWalksWorkSteps"] as const),
  updateWalkPageCopyWork,
);
export const updateMonthlyClockInGoal = guardForm(
  "organiser",
  monthlyGoalSchema,
  (formData) => readStrings(formData, ["monthlyClockInGoal"] as const),
  updateMonthlyClockInGoalWork,
);
export const updateSiteLogo = guardForm("organiser", pass, readPass, updateSiteLogoWork);
export const updateSiteFavicon = guardForm("organiser", pass, readPass, updateSiteFaviconWork);
export const updateReportBanner = guardForm("organiser", pass, readPass, updateReportBannerWork);
export const updateWalkEssentials = guardForm(
  "organiser",
  walkEssentialsSchema,
  readWalkEssentials,
  updateWalkEssentialsWork,
);
