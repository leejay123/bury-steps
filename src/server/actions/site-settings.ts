"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseTestimonialsSectionIntro, parseTestimonialsSectionTitle } from "@/lib/testimonials";
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
  parseAboutList,
  parseAboutRules,
  parseHowThisStartedBody,
  parseHowThisStartedEyebrow,
  parseHowThisStartedTeaser,
  parseHowThisStartedTitle,
  serializeAboutList,
  serializeAboutRules,
} from "@/lib/homepage-copy";
import { SITE_SETTING_ID, DEFAULT_PRIMARY_COLOR } from "@/lib/theme";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-cache";
import {
  DEFAULT_COOKIE_CONSENT_VARIANT,
  parseCookieConsentVariant,
} from "@/lib/cookie-consent-variant";
import { parseFacebookGroupUrl, parseSiteName, parseSiteTagline } from "@/lib/site-branding";
import { MAX_MONTHLY_CLOCK_IN_GOAL } from "@/lib/walk-game";
import { readImageDimensions } from "@/lib/image-dimensions";
import {
  type ActionResult,
  logActionError,
  readOptionalImage,
  revalidateHomepage,
} from "./shared";

export async function updateCarouselEnabled(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
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

export async function updateScrollToTopEnabled(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
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
  revalidatePath("/admin/settings/display");
  return { ok: true, message: enabled ? "Back to top is on." : "Back to top is off." };
}

export async function updateCookieConsentVariant(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
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
  revalidatePath("/admin/settings/display");
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

export async function updateSiteBranding(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
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
  revalidatePath("/admin/settings/display");
  return { ok: true, message: "Site name and tagline saved." };
}

export async function updateFacebookGroupUrl(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
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
  revalidatePath("/admin/settings/display");
  return {
    ok: true,
    message: facebookGroupUrl
      ? "Facebook group link saved."
      : "Facebook group link hidden.",
  };
}

export async function reorderHomepageSections(ids: HomepageSectionId[]): Promise<ActionResult> {
  await requireAdmin();
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
  revalidatePath("/admin/settings/display");
  return { ok: true, message: "Homepage section order saved." };
}

export async function updateFaqSectionCopy(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
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
  revalidatePath("/admin/settings/display");
  return { ok: true, message: "FAQ heading and intro saved." };
}

export async function updateTestimonialsSectionCopy(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const testimonialsSectionTitle = parseTestimonialsSectionTitle(
    String(formData.get("testimonialsSectionTitle") ?? ""),
  );
  const testimonialsSectionIntro = parseTestimonialsSectionIntro(
    String(formData.get("testimonialsSectionIntro") ?? ""),
  );
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
        testimonialsSectionTitle,
        testimonialsSectionIntro,
      },
      update: { testimonialsSectionTitle, testimonialsSectionIntro },
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
  revalidatePath("/admin/settings/display");
  return { ok: true, message: "Testimonials heading and intro saved." };
}

export async function updateHowThisStartedCopy(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
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
  revalidatePath("/admin/settings/display");
  return { ok: true, message: "How this started copy saved." };
}

export async function updateAboutLists(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const aboutGoals = parseAboutList(String(formData.get("aboutGoals") ?? ""));
  const aboutPlaces = parseAboutList(String(formData.get("aboutPlaces") ?? ""));
  const aboutExpect = parseAboutList(String(formData.get("aboutExpect") ?? ""));
  const aboutRules = parseAboutRules(String(formData.get("aboutRules") ?? ""));
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
      },
      update: {
        aboutGoals: aboutGoalsText,
        aboutPlaces: aboutPlacesText,
        aboutExpect: aboutExpectText,
        aboutRules: aboutRulesText,
      },
    });
  } catch (err) {
    return logActionError("updateAboutLists", err, "Could not save that setting. Try again.");
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/display");
  return { ok: true, message: "About lists saved." };
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

export async function updateMonthlyClockInGoal(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
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
      ? `Together goal is ${parsed.toLocaleString("en-GB")} clock-ins this month.`
      : "Together goal is off.",
  };
}

export async function updateSiteLogo(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
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
        ...(image ? { logoMime: image.mime, logoData: image.data } : {}),
      },
      update: image ? { logoMime: image.mime, logoData: image.data } : { logoMime: null, logoData: null },
    });
  } catch (err) {
    return logActionError("updateSiteLogo", err, "Could not save that logo. Try again.");
  }

  revalidateHomepage();
  revalidatePath("/", "layout");
  return { ok: true, message: removing ? "Back to the default logo." : "Logo updated." };
}

export async function updateSiteFavicon(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
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
