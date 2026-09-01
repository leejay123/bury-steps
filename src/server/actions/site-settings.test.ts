import { describe, expect, it, vi, beforeEach } from "vitest";

const { requireAdmin, prismaMock } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  prismaMock: { siteSetting: { upsert: vi.fn() } },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin };
});

import {
  reorderHomepageSections,
  updateAboutLists,
  updateCookieConsentVariant,
  updateFacebookGroupUrl,
  updateMonthlyClockInGoal,
  updateSiteBranding,
} from "./site-settings";

const ADMIN = { id: "admin-1" };

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue(ADMIN);
  prismaMock.siteSetting.upsert.mockResolvedValue({});
});

describe("updateSiteBranding", () => {
  it("rejects a name that's too short", async () => {
    const result = await updateSiteBranding(null, form({ siteName: "A", siteTagline: "x".repeat(20) }));
    expect(result).toEqual({ ok: false, error: "Give the site a name of 2–80 characters." });
  });

  it("rejects a tagline that's too short", async () => {
    const result = await updateSiteBranding(null, form({ siteName: "Bury Steps", siteTagline: "x" }));
    expect(result).toEqual({ ok: false, error: "Give a short tagline of 8–220 characters." });
  });

  it("saves valid branding", async () => {
    const result = await updateSiteBranding(
      null,
      form({ siteName: "Bury Steps", siteTagline: "A friendly walking group." }),
    );
    expect(result).toEqual({ ok: true, message: "Site name and tagline saved." });
  });
});

describe("updateFacebookGroupUrl", () => {
  it("rejects a non-https URL", async () => {
    const result = await updateFacebookGroupUrl(null, form({ facebookGroupUrl: "http://facebook.com/x" }));
    expect(result.ok).toBe(false);
  });

  it("allows clearing the link entirely", async () => {
    const result = await updateFacebookGroupUrl(null, form({ facebookGroupUrl: "" }));
    expect(result).toEqual({ ok: true, message: "Facebook group link hidden." });
  });

  it("saves a valid link", async () => {
    const result = await updateFacebookGroupUrl(
      null,
      form({ facebookGroupUrl: "https://facebook.com/groups/burysteps" }),
    );
    expect(result).toEqual({ ok: true, message: "Facebook group link saved." });
  });
});

describe("updateCookieConsentVariant", () => {
  it("rejects an unknown layout", async () => {
    const result = await updateCookieConsentVariant(null, form({ cookieConsentVariant: "banana" }));
    expect(result).toEqual({ ok: false, error: "Choose a cookie notice layout." });
  });

  it("saves a valid layout", async () => {
    const result = await updateCookieConsentVariant(null, form({ cookieConsentVariant: "mini" }));
    expect(result.ok).toBe(true);
  });
});

describe("reorderHomepageSections", () => {
  it("rejects a set of section ids that isn't a valid permutation", async () => {
    const result = await reorderHomepageSections(["notASection" as never]);
    expect(result).toEqual({ ok: false, error: "Could not save that order. Try again." });
    expect(prismaMock.siteSetting.upsert).not.toHaveBeenCalled();
  });

  it("saves a valid section order", async () => {
    const result = await reorderHomepageSections([
      "howWalksWork",
      "howThisStarted",
      "memberNotices",
      "testimonials",
      "faqs",
    ]);
    expect(result).toEqual({ ok: true, message: "Homepage section order saved." });
  });
});

describe("updateAboutLists", () => {
  it("rejects when a list is empty", async () => {
    const result = await updateAboutLists(
      null,
      form({ aboutGoals: "", aboutPlaces: "a", aboutExpect: "a", aboutRules: "Title | Body" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Goals need/);
  });

  it("saves valid lists", async () => {
    const result = await updateAboutLists(
      null,
      form({
        aboutGoals: "Get fitter",
        aboutPlaces: "Bury",
        aboutExpect: "A friendly welcome",
        aboutRules: "Be kind | Look out for each other",
      }),
    );
    expect(result).toEqual({ ok: true, message: "About lists saved." });
  });
});

describe("updateMonthlyClockInGoal", () => {
  it("treats an empty value as turning the goal off", async () => {
    const result = await updateMonthlyClockInGoal(null, form({ monthlyClockInGoal: "" }));
    expect(prismaMock.siteSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { monthlyClockInGoal: null } }),
    );
    expect(result).toEqual({ ok: true, message: "Together goal is off." });
  });

  it("treats a literal zero the same as turning the goal off", async () => {
    await updateMonthlyClockInGoal(null, form({ monthlyClockInGoal: "0" }));
    expect(prismaMock.siteSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { monthlyClockInGoal: null } }),
    );
  });

  it("rejects a non-numeric value", async () => {
    const result = await updateMonthlyClockInGoal(null, form({ monthlyClockInGoal: "lots" }));
    expect(result.ok).toBe(false);
  });

  it("rejects a value over the cap", async () => {
    const result = await updateMonthlyClockInGoal(null, form({ monthlyClockInGoal: "10000" }));
    expect(result.ok).toBe(false);
  });

  it("saves a valid goal", async () => {
    const result = await updateMonthlyClockInGoal(null, form({ monthlyClockInGoal: "150" }));
    expect(result).toEqual({ ok: true, message: "Together goal is 150 clock-ins this month." });
  });
});
