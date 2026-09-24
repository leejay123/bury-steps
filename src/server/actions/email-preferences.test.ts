import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  prismaMock,
  requireUser,
  syncNewsletterAudienceToPreference,
  optOutNewsletterEverywhere,
} = vi.hoisted(() => ({
  prismaMock: { user: { update: vi.fn(), findUnique: vi.fn() } },
  requireUser: vi.fn(),
  syncNewsletterAudienceToPreference: vi.fn(async () => {}),
  optOutNewsletterEverywhere: vi.fn(async () => {}),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireUser };
});
vi.mock("@/lib/email/newsletter-opt-out", () => ({
  syncNewsletterAudienceToPreference,
  optOutNewsletterEverywhere,
}));

import { updateMemberEmailPreferences, updateMyEmailPreferences } from "./email-preferences";

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateMemberEmailPreferences", () => {
  it("rejects a missing token without touching the database", async () => {
    const result = await updateMemberEmailPreferences(null, form({}));
    expect(result).toEqual({ ok: false, error: "This link is missing its token." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("saves checked boxes as true and omitted ones as false", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: "MEMBER", emailNewsletter: false });
    prismaMock.user.update.mockResolvedValueOnce({
      email: "a@example.com",
      firstName: null,
      emailNewsletter: false,
    });

    const result = await updateMemberEmailPreferences(
      null,
      form({
        token: "tok123",
        emailWalkAnnouncements: "on",
        emailNotices: "on",
        // emailProgress and emailNewsletter left unchecked — omitted from FormData.
      }),
    );

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { unsubscribeToken: "tok123" },
      data: {
        emailWalkAnnouncements: true,
        emailNotices: true,
        emailProgress: false,
        emailNewsletter: false,
      },
      select: { email: true, firstName: true, emailNewsletter: true },
    });
    // false→false: preserve an independent footer signup via sync, do not
    // force a full opt-out.
    expect(syncNewsletterAudienceToPreference).toHaveBeenCalledWith("a@example.com", null);
    expect(optOutNewsletterEverywhere).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, message: "Your email preferences have been saved." });
  });

  it("opts out of footer and Resend when Newsletter flips from on to off", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: "MEMBER", emailNewsletter: true });
    prismaMock.user.update.mockResolvedValueOnce({
      email: "a@example.com",
      firstName: "Ada",
      emailNewsletter: false,
    });

    await updateMemberEmailPreferences(null, form({ token: "tok123" }));

    expect(optOutNewsletterEverywhere).toHaveBeenCalledWith("a@example.com");
    expect(syncNewsletterAudienceToPreference).not.toHaveBeenCalled();
  });

  it("reports an invalid link for an unknown token instead of a generic error", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const result = await updateMemberEmailPreferences(null, form({ token: "does-not-exist" }));
    expect(result).toEqual({ ok: false, error: "This link is invalid or has expired." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("reports an invalid link if the row disappears between the check and the save", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: "MEMBER", emailNewsletter: false });
    prismaMock.user.update.mockRejectedValueOnce({ code: "P2025" });
    const result = await updateMemberEmailPreferences(null, form({ token: "tok123" }));
    expect(result).toEqual({ ok: false, error: "This link is invalid or has expired." });
  });

  it("saves an organiser's accident-alert preference independently", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", emailNewsletter: false });
    prismaMock.user.update.mockResolvedValueOnce({
      email: "a@example.com",
      firstName: null,
      emailNewsletter: false,
    });

    await updateMemberEmailPreferences(
      null,
      form({ token: "tok123", emailAccidentAlerts: "on" }),
    );

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ emailAccidentAlerts: true }),
      }),
    );
  });

  it("leaves a plain member's accident-alert default alone, so it survives a later promotion", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: "MEMBER", emailNewsletter: false });
    prismaMock.user.update.mockResolvedValueOnce({
      email: "a@example.com",
      firstName: null,
      emailNewsletter: false,
    });

    await updateMemberEmailPreferences(null, form({ token: "tok123" }));

    const { data } = prismaMock.user.update.mock.calls[0][0];
    expect(data).not.toHaveProperty("emailAccidentAlerts");
  });

  it("always aligns Resend to the saved preference, including newsletter opt-in", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: "MEMBER", emailNewsletter: false });
    prismaMock.user.update.mockResolvedValueOnce({
      email: "a@example.com",
      firstName: "Ada",
      emailNewsletter: true,
    });

    await updateMemberEmailPreferences(
      null,
      form({ token: "tok123", emailNewsletter: "on" }),
    );

    expect(syncNewsletterAudienceToPreference).toHaveBeenCalledWith("a@example.com", "Ada");
    expect(optOutNewsletterEverywhere).not.toHaveBeenCalled();
  });
});

describe("updateMyEmailPreferences", () => {
  beforeEach(() => {
    requireUser.mockResolvedValue({
      id: "user-1",
      role: "MEMBER",
      email: "a@example.com",
      firstName: null,
      emailNewsletter: false,
    });
  });

  it("saves preferences for the signed-in user, no token needed", async () => {
    prismaMock.user.update.mockResolvedValueOnce({
      email: "a@example.com",
      firstName: null,
      emailNewsletter: true,
    });

    const result = await updateMyEmailPreferences(
      null,
      form({ emailNewsletter: "on" }),
    );

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        emailWalkAnnouncements: false,
        emailNotices: false,
        emailProgress: false,
        emailNewsletter: true,
      },
      select: { email: true, firstName: true, emailNewsletter: true },
    });
    expect(syncNewsletterAudienceToPreference).toHaveBeenCalledWith("a@example.com", null);
    expect(result).toEqual({ ok: true, message: "Your email preferences have been saved." });
  });

  it("opts out everywhere when the signed-in member turns Newsletter off", async () => {
    requireUser.mockResolvedValueOnce({
      id: "user-1",
      role: "MEMBER",
      email: "a@example.com",
      firstName: null,
      emailNewsletter: true,
    });
    prismaMock.user.update.mockResolvedValueOnce({
      email: "a@example.com",
      firstName: null,
      emailNewsletter: false,
    });

    await updateMyEmailPreferences(null, form({}));

    expect(optOutNewsletterEverywhere).toHaveBeenCalledWith("a@example.com");
    expect(syncNewsletterAudienceToPreference).not.toHaveBeenCalled();
  });

  it("reports a generic failure on an unexpected database error", async () => {
    prismaMock.user.update.mockRejectedValueOnce(new Error("db down"));
    const result = await updateMyEmailPreferences(null, form({}));
    expect(result).toEqual({ ok: false, error: "Could not save your preferences. Try again." });
  });
});
