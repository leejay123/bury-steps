"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { WELCOME_NOTICE_SYSTEM_KEY } from "@/lib/notices";
import { SITE_SETTING_ID, DEFAULT_PRIMARY_COLOR } from "@/lib/theme";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-cache";
import { NOTICES_CACHE_TAG } from "@/lib/site-notices";
import { DEFAULT_COOKIE_CONSENT_VARIANT } from "@/lib/cookie-consent-variant";
import {
  DEFAULT_FACEBOOK_GROUP_URL,
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_TAGLINE,
} from "@/lib/site-branding";
import {
  DEFAULT_TESTIMONIALS_SECTION_INTRO,
  DEFAULT_TESTIMONIALS_SECTION_TITLE,
} from "@/lib/testimonials";
import { DEFAULT_FAQ_SECTION_INTRO, DEFAULT_FAQ_SECTION_TITLE } from "@/lib/faqs";
import { DEFAULT_HOMEPAGE_SECTION_ORDER_TEXT } from "@/lib/homepage-sections";
import {
  DEFAULT_ABOUT_EXPECT_TEXT,
  DEFAULT_ABOUT_GOALS_TEXT,
  DEFAULT_ABOUT_PLACES_TEXT,
  DEFAULT_ABOUT_RULES_TEXT,
  DEFAULT_HOW_THIS_STARTED_BODY,
  DEFAULT_HOW_THIS_STARTED_EYEBROW,
  DEFAULT_HOW_THIS_STARTED_TEASER,
  DEFAULT_HOW_THIS_STARTED_TITLE,
} from "@/lib/homepage-copy";
import {
  DEFAULT_FAQS,
  DEFAULT_FAQ_CATEGORIES,
  DEFAULT_HERO_SLIDE,
  DEFAULT_TESTIMONIALS,
  DEFAULT_WELCOME_NOTICE,
} from "@/lib/site-defaults";
import { isResetConfirmWord } from "@/lib/site-reset";
import { type ActionResult, isNotFoundStatus, logActionError } from "./shared";

export async function clearSiteCache(
  _prev: ActionResult | null,
  _formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidateTag(NOTICES_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: "Site cache cleared. The public homepage will refresh on the next visit.",
  };
}

export async function resetSiteToDefault(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!isResetConfirmWord(String(formData.get("confirm") ?? ""))) {
    return { ok: false, error: "Type delete to confirm, then try again." };
  }

  const limited = checkRateLimit(`${admin.id}:resetSiteToDefault`, 3, 10 * 60_000);
  if (!limited.ok) return { ok: false, error: "Try again in a few minutes." };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.accidentReport.deleteMany();
      await tx.walk.deleteMany();
      await tx.siteNotice.deleteMany();
      await tx.siteNoticeCategory.deleteMany();
      await tx.siteNoticeCategory.create({
        data: {
          id: "noticecat_general",
          slug: "general",
          label: "General",
          sortOrder: 0,
        },
      });
      await tx.siteNotice.create({
        data: {
          id: DEFAULT_WELCOME_NOTICE.id,
          title: DEFAULT_WELCOME_NOTICE.title,
          body: DEFAULT_WELCOME_NOTICE.body,
          kind: "BELL",
          audience: "MEMBERS",
          slug: null,
          pageBody: null,
          categoryId: null,
          systemKey: WELCOME_NOTICE_SYSTEM_KEY,
          enabled: true,
        },
      });
      await tx.homepageFaq.deleteMany();
      await tx.homepageFaqCategory.deleteMany();
      await tx.homepageSlide.deleteMany();
      await tx.homepageTestimonial.deleteMany();
      await tx.user.deleteMany({ where: { id: { not: admin.id } } });
      await tx.siteSetting.upsert({
        where: { id: SITE_SETTING_ID },
        create: {
          id: SITE_SETTING_ID,
          primaryColor: DEFAULT_PRIMARY_COLOR,
          carouselEnabled: true,
          scrollToTopEnabled: true,
          cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
          siteName: DEFAULT_SITE_NAME,
          siteTagline: DEFAULT_SITE_TAGLINE,
          facebookGroupUrl: DEFAULT_FACEBOOK_GROUP_URL,
          testimonialsEnabled: true,
          testimonialsSectionTitle: DEFAULT_TESTIMONIALS_SECTION_TITLE,
          testimonialsSectionIntro: DEFAULT_TESTIMONIALS_SECTION_INTRO,
          faqsEnabled: true,
          faqSectionTitle: DEFAULT_FAQ_SECTION_TITLE,
          faqSectionIntro: DEFAULT_FAQ_SECTION_INTRO,
          howThisStartedEnabled: true,
          howThisStartedTitle: DEFAULT_HOW_THIS_STARTED_TITLE,
          howThisStartedEyebrow: DEFAULT_HOW_THIS_STARTED_EYEBROW,
          howThisStartedTeaser: DEFAULT_HOW_THIS_STARTED_TEASER,
          howThisStartedBody: DEFAULT_HOW_THIS_STARTED_BODY,
          aboutGoals: DEFAULT_ABOUT_GOALS_TEXT,
          aboutPlaces: DEFAULT_ABOUT_PLACES_TEXT,
          aboutExpect: DEFAULT_ABOUT_EXPECT_TEXT,
          aboutRules: DEFAULT_ABOUT_RULES_TEXT,
          homepageSectionOrder: DEFAULT_HOMEPAGE_SECTION_ORDER_TEXT,
          memberNoticesEnabled: true,
          howWalksWorkEnabled: true,
          monthlyClockInGoal: null,
        },
        update: {
          primaryColor: DEFAULT_PRIMARY_COLOR,
          carouselEnabled: true,
          scrollToTopEnabled: true,
          cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
          siteName: DEFAULT_SITE_NAME,
          siteTagline: DEFAULT_SITE_TAGLINE,
          facebookGroupUrl: DEFAULT_FACEBOOK_GROUP_URL,
          testimonialsEnabled: true,
          testimonialsSectionTitle: DEFAULT_TESTIMONIALS_SECTION_TITLE,
          testimonialsSectionIntro: DEFAULT_TESTIMONIALS_SECTION_INTRO,
          faqsEnabled: true,
          faqSectionTitle: DEFAULT_FAQ_SECTION_TITLE,
          faqSectionIntro: DEFAULT_FAQ_SECTION_INTRO,
          howThisStartedEnabled: true,
          howThisStartedTitle: DEFAULT_HOW_THIS_STARTED_TITLE,
          howThisStartedEyebrow: DEFAULT_HOW_THIS_STARTED_EYEBROW,
          howThisStartedTeaser: DEFAULT_HOW_THIS_STARTED_TEASER,
          howThisStartedBody: DEFAULT_HOW_THIS_STARTED_BODY,
          aboutGoals: DEFAULT_ABOUT_GOALS_TEXT,
          aboutPlaces: DEFAULT_ABOUT_PLACES_TEXT,
          aboutExpect: DEFAULT_ABOUT_EXPECT_TEXT,
          aboutRules: DEFAULT_ABOUT_RULES_TEXT,
          homepageSectionOrder: DEFAULT_HOMEPAGE_SECTION_ORDER_TEXT,
          memberNoticesEnabled: true,
          howWalksWorkEnabled: true,
          monthlyClockInGoal: null,
        },
      });
      await tx.homepageFaqCategory.createMany({
        data: DEFAULT_FAQ_CATEGORIES.map((category) => ({
          id: category.id,
          slug: category.slug,
          label: category.label,
          sortOrder: category.sortOrder,
        })),
      });
      await tx.homepageFaq.createMany({
        data: DEFAULT_FAQS.map((faq) => ({
          id: faq.id,
          sortOrder: faq.sortOrder,
          categoryId: faq.categoryId,
          question: faq.question,
          answer: faq.answer,
        })),
      });
      await tx.homepageSlide.create({
        data: {
          id: DEFAULT_HERO_SLIDE.id,
          sortOrder: DEFAULT_HERO_SLIDE.sortOrder,
          alt: DEFAULT_HERO_SLIDE.alt,
          imagePath: DEFAULT_HERO_SLIDE.imagePath,
        },
      });
      await tx.homepageTestimonial.createMany({
        data: DEFAULT_TESTIMONIALS.map((row) => ({
          id: row.id,
          sortOrder: row.sortOrder,
          name: row.name,
          role: row.role,
          quote: row.quote,
        })),
      });
    });
  } catch (err) {
    return logActionError("resetSiteToDefault", err, "Could not reset the site. Try again.");
  }

  // List Clerk after the DB wipe so anyone who signed up during the wipe is
  // still revoked — do not trust a pre-transaction snapshot (TOCTOU).
  const clerk = await clerkClient();
  let clerkFailed = 0;
  try {
    let offset = 0;
    for (;;) {
      const page = await clerk.users.getUserList({ limit: 100, offset });
      if (page.data.length === 0) break;
      for (const clerkUser of page.data) {
        if (clerkUser.id === admin.clerkId) continue;
        try {
          await clerk.users.deleteUser(clerkUser.id);
        } catch (err) {
          if (!isNotFoundStatus(err)) {
            clerkFailed += 1;
            console.error("resetSiteToDefault: Clerk login removal failed", err);
          }
        }
      }
      if (page.data.length < 100) break;
      offset += page.data.length;
    }
  } catch (err) {
    clerkFailed += 1;
    console.error("resetSiteToDefault: Clerk user list failed", err);
  }

  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidateTag(NOTICES_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/progress");
  revalidatePath("/dashboard/history");

  if (clerkFailed > 0) {
    return {
      ok: true,
      message:
        "The site is reset. You are still the organiser. Some old sign-ins could not be revoked automatically — remove them from Clerk if needed.",
    };
  }

  return {
    ok: true,
    message: "The site is reset to the starter homepage. You are still the organiser. Everyone else will need to join again.",
  };
}
