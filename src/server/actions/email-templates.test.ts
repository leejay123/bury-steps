import { describe, expect, it, vi, beforeEach } from "vitest";

const { requireAdmin, prismaMock, sendTestEmail, checkRateLimit } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  prismaMock: {
    emailTemplateOverride: {
      findMany: vi.fn(async (): Promise<{ key: string; subject: string | null; body: string | null }[]> => []),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
  sendTestEmail: vi.fn(async () => {}),
  checkRateLimit: vi.fn(() => ({ ok: true }) as { ok: true } | { ok: false; retryAfterSeconds: number }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin };
});
// Real sending pulls in site-theme.ts (next/cache's unstable_cache, not
// mocked above) and hits the network — out of scope for these tests.
vi.mock("@/lib/email/test-send", () => ({ sendTestEmail }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));

import {
  getEmailTemplateOverrides,
  resetEmailTemplate,
  sendTestEmailTemplate,
  updateEmailTemplate,
} from "./email-templates";

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

// Full access by default so existing tests exercise the authorized path —
// see the "permission guard" tests below for permEmails: false.
function admin(overrides: Partial<Record<string, boolean>> = {}) {
  return {
    id: "admin-1",
    email: "admin@example.com",
    permWalks: true,
    permMembers: true,
    permMessages: true,
    permReports: true,
    permHomepage: true,
    permNotices: true,
    permProgress: true,
    permEmails: true,
    permSubscribers: true,
    permDisplay: true,
    permCacheReset: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue(admin());
  prismaMock.emailTemplateOverride.findMany.mockResolvedValue([]);
  checkRateLimit.mockReturnValue({ ok: true });
});

describe("getEmailTemplateOverrides", () => {
  it("returns null subject/body for every template for an organiser without the Emails permission", async () => {
    requireAdmin.mockResolvedValueOnce(admin({ permEmails: false }));
    const overrides = await getEmailTemplateOverrides();
    expect(overrides.welcome).toEqual({ subject: null, body: null });
    expect(prismaMock.emailTemplateOverride.findMany).not.toHaveBeenCalled();
  });

  it("returns null subject/body for every template with no saved row", async () => {
    const overrides = await getEmailTemplateOverrides();
    expect(overrides.welcome).toEqual({ subject: null, body: null });
    expect(overrides.accidentReportAlert).toEqual({ subject: null, body: null });
    // Every registry key is present, not just the ones with rows.
    expect(Object.keys(overrides).length).toBeGreaterThanOrEqual(10);
  });

  it("fills in a saved row for the template it belongs to", async () => {
    prismaMock.emailTemplateOverride.findMany.mockResolvedValueOnce([
      { key: "welcome", subject: "Hiya!", body: "Custom text." },
    ]);
    const overrides = await getEmailTemplateOverrides();
    expect(overrides.welcome).toEqual({ subject: "Hiya!", body: "Custom text." });
    expect(overrides.accountDeleted).toEqual({ subject: null, body: null });
  });
});

describe("updateEmailTemplate", () => {
  it("rejects an organiser without the Emails permission", async () => {
    requireAdmin.mockResolvedValueOnce(admin({ permEmails: false }));
    const result = await updateEmailTemplate(null, form({ key: "welcome" }));
    expect(result).toEqual({ ok: false, error: "You do not have permission to manage emails." });
    expect(prismaMock.emailTemplateOverride.upsert).not.toHaveBeenCalled();
  });

  it("rejects an unknown key", async () => {
    const result = await updateEmailTemplate(null, form({ key: "not-a-real-key" }));
    expect(result).toEqual({ ok: false, error: "Unknown email." });
    expect(prismaMock.emailTemplateOverride.upsert).not.toHaveBeenCalled();
  });

  it("saves subject and body, nulling a blank subject but keeping a blank body", async () => {
    prismaMock.emailTemplateOverride.upsert.mockResolvedValueOnce({});
    const result = await updateEmailTemplate(
      null,
      form({ key: "contactAdminAlert", subject: "  ", body: "" }),
    );

    expect(prismaMock.emailTemplateOverride.upsert).toHaveBeenCalledWith({
      where: { key: "contactAdminAlert" },
      create: { key: "contactAdminAlert", subject: null, body: "" },
      update: { subject: null, body: "" },
    });
    expect(result).toEqual({ ok: true, message: "Email updated." });
  });

  it("rejects a subject over the length limit", async () => {
    const result = await updateEmailTemplate(
      null,
      form({ key: "welcome", subject: "x".repeat(300), body: "" }),
    );
    expect(result.ok).toBe(false);
    expect(prismaMock.emailTemplateOverride.upsert).not.toHaveBeenCalled();
  });
});

describe("sendTestEmailTemplate", () => {
  it("rejects an organiser without the Emails permission", async () => {
    requireAdmin.mockResolvedValueOnce(admin({ permEmails: false }));
    const result = await sendTestEmailTemplate(null, form({ key: "welcome" }));
    expect(result).toEqual({ ok: false, error: "You do not have permission to manage emails." });
    expect(sendTestEmail).not.toHaveBeenCalled();
  });

  it("rejects an unknown key", async () => {
    const result = await sendTestEmailTemplate(null, form({ key: "not-a-real-key" }));
    expect(result).toEqual({ ok: false, error: "Unknown email." });
    expect(sendTestEmail).not.toHaveBeenCalled();
  });

  it("sends a test to the requesting admin's own address", async () => {
    const result = await sendTestEmailTemplate(null, form({ key: "welcome" }));

    expect(sendTestEmail).toHaveBeenCalledWith(
      "welcome",
      expect.objectContaining({ id: "admin-1", email: "admin@example.com" }),
    );
    expect(result).toEqual({ ok: true, message: "Test email sent to admin@example.com." });
  });

  it("rate-limits repeated test sends", async () => {
    checkRateLimit.mockReturnValueOnce({ ok: false, retryAfterSeconds: 30 });
    const result = await sendTestEmailTemplate(null, form({ key: "welcome" }));
    expect(result).toEqual({ ok: false, error: "Too many test sends. Try again in 30s." });
    expect(sendTestEmail).not.toHaveBeenCalled();
  });

  it("reports a generic failure if the send throws", async () => {
    sendTestEmail.mockRejectedValueOnce(new Error("resend down"));
    const result = await sendTestEmailTemplate(null, form({ key: "welcome" }));
    expect(result).toEqual({ ok: false, error: "Could not send the test email. Try again." });
  });
});

describe("resetEmailTemplate", () => {
  it("rejects an organiser without the Emails permission", async () => {
    requireAdmin.mockResolvedValueOnce(admin({ permEmails: false }));
    const result = await resetEmailTemplate(null, form({ key: "welcome" }));
    expect(result).toEqual({ ok: false, error: "You do not have permission to manage emails." });
    expect(prismaMock.emailTemplateOverride.deleteMany).not.toHaveBeenCalled();
  });

  it("rejects an unknown key", async () => {
    const result = await resetEmailTemplate(null, form({ key: "not-a-real-key" }));
    expect(result).toEqual({ ok: false, error: "Unknown email." });
    expect(prismaMock.emailTemplateOverride.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes the saved row for that template", async () => {
    prismaMock.emailTemplateOverride.deleteMany.mockResolvedValueOnce({ count: 1 });
    const result = await resetEmailTemplate(null, form({ key: "welcome" }));
    expect(prismaMock.emailTemplateOverride.deleteMany).toHaveBeenCalledWith({
      where: { key: "welcome" },
    });
    expect(result).toEqual({ ok: true, message: "Reset to the default wording." });
  });
});
