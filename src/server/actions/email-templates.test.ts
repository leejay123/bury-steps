import { describe, expect, it, vi, beforeEach } from "vitest";

const { requireAdmin, prismaMock } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  prismaMock: {
    emailTemplateOverride: {
      findMany: vi.fn(async (): Promise<{ key: string; subject: string | null; body: string | null }[]> => []),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin };
});

import { getEmailTemplateOverrides, resetEmailTemplate, updateEmailTemplate } from "./email-templates";

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue({ id: "admin-1" });
  prismaMock.emailTemplateOverride.findMany.mockResolvedValue([]);
});

describe("getEmailTemplateOverrides", () => {
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

describe("resetEmailTemplate", () => {
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
