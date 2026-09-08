import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock, requireUser } = vi.hoisted(() => ({
  prismaMock: { user: { update: vi.fn() } },
  requireUser: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireUser };
});

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
    prismaMock.user.update.mockResolvedValueOnce({});

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
        emailOrganiserAlerts: false,
      },
    });
    expect(result).toEqual({ ok: true, message: "Your email preferences have been saved." });
  });

  it("reports an invalid link for an unknown token instead of a generic error", async () => {
    prismaMock.user.update.mockRejectedValueOnce({ code: "P2025" });
    const result = await updateMemberEmailPreferences(null, form({ token: "does-not-exist" }));
    expect(result).toEqual({ ok: false, error: "This link is invalid or has expired." });
  });

  it("saves an organiser's alert preference too, harmless for a non-admin row", async () => {
    prismaMock.user.update.mockResolvedValueOnce({});

    await updateMemberEmailPreferences(
      null,
      form({ token: "tok123", emailOrganiserAlerts: "on" }),
    );

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ emailOrganiserAlerts: true }) }),
    );
  });
});

describe("updateMyEmailPreferences", () => {
  beforeEach(() => {
    requireUser.mockResolvedValue({ id: "user-1" });
  });

  it("saves preferences for the signed-in user, no token needed", async () => {
    prismaMock.user.update.mockResolvedValueOnce({});

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
        emailOrganiserAlerts: false,
      },
    });
    expect(result).toEqual({ ok: true, message: "Your email preferences have been saved." });
  });

  it("reports a generic failure on an unexpected database error", async () => {
    prismaMock.user.update.mockRejectedValueOnce(new Error("db down"));
    const result = await updateMyEmailPreferences(null, form({}));
    expect(result).toEqual({ ok: false, error: "Could not save your preferences. Try again." });
  });
});
