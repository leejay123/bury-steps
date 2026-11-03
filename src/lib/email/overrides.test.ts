import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    emailTemplateOverride: {
      findUnique: vi.fn(async (): Promise<{ subject: string | null; body: string | null } | null> => null),
    },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { resolveEmailCopy } from "./overrides";

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.emailTemplateOverride.findUnique.mockResolvedValue(null);
});

describe("resolveEmailCopy", () => {
  it("uses the registry default when there is no saved override", async () => {
    const copy = await resolveEmailCopy("welcome", { siteName: "Bury Steps" });
    expect(copy.subject).toBe("Welcome to Bury Steps");
    expect(copy.bodyParagraphs[0]).toContain("Thanks for joining Bury Steps.");
  });

  it("fills placeholders in a saved override", async () => {
    prismaMock.emailTemplateOverride.findUnique.mockResolvedValueOnce({
      subject: "You're in, {siteName}!",
      body: "Thanks for joining {siteName}.",
    });
    const copy = await resolveEmailCopy("welcome", { siteName: "Bury Steps" });
    expect(copy.subject).toBe("You're in, Bury Steps!");
    expect(copy.bodyParagraphs).toEqual(["Thanks for joining Bury Steps."]);
  });

  it("falls back to the default subject when the override's subject is blank", async () => {
    prismaMock.emailTemplateOverride.findUnique.mockResolvedValueOnce({ subject: "  ", body: null });
    const copy = await resolveEmailCopy("welcome", { siteName: "Bury Steps" });
    expect(copy.subject).toBe("Welcome to Bury Steps");
  });

  it("keeps a deliberately empty override body empty, rather than falling back", async () => {
    prismaMock.emailTemplateOverride.findUnique.mockResolvedValueOnce({ subject: null, body: "" });
    const copy = await resolveEmailCopy("welcome", { siteName: "Bury Steps" });
    expect(copy.bodyParagraphs).toEqual([]);
  });

  it("falls back to the default copy if the lookup throws", async () => {
    prismaMock.emailTemplateOverride.findUnique.mockRejectedValueOnce(new Error("db down"));
    const copy = await resolveEmailCopy("welcome", { siteName: "Bury Steps" });
    expect(copy.subject).toBe("Welcome to Bury Steps");
  });
});
