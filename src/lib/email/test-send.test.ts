import { describe, expect, it, vi, beforeEach } from "vitest";
import { EMAIL_TEMPLATES } from "./registry";

const { sendEmail, getEmailBrand, getOrCreateUserUnsubscribeToken, prismaMock } = vi.hoisted(() => ({
  sendEmail: vi.fn(async () => {}),
  getEmailBrand: vi.fn(async () => ({
    siteName: "Bury Steps Walking Group",
    logoUrl: "https://burysteps-walkinggroup.co.uk/bury-steps-logo.png",
    siteUrl: "https://burysteps-walkinggroup.co.uk",
  })),
  getOrCreateUserUnsubscribeToken: vi.fn(async (_id: string, existing: string | null) => existing ?? "generated-token"),
  prismaMock: {
    emailTemplateOverride: {
      findUnique: vi.fn(async (): Promise<{ subject: string | null; body: string | null } | null> => null),
    },
  },
}));

vi.mock("./client", () => ({ sendEmail }));
vi.mock("./brand", () => ({ getEmailBrand }));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("./unsubscribe", () => ({
  getOrCreateUserUnsubscribeToken,
  memberPreferencesUrl: (token: string) => `https://burysteps-walkinggroup.co.uk/email-preferences/${token}`,
  newsletterUnsubscribeUrl: (token: string) => `https://burysteps-walkinggroup.co.uk/email-preferences/newsletter/${token}`,
}));

import { sendTestEmail } from "./test-send";

const ADMIN = { id: "admin-1", email: "admin@example.com", firstName: "Jane", unsubscribeToken: null };

beforeEach(() => {
  vi.clearAllMocks();
  getEmailBrand.mockResolvedValue({
    siteName: "Bury Steps Walking Group",
    logoUrl: "https://burysteps-walkinggroup.co.uk/bury-steps-logo.png",
    siteUrl: "https://burysteps-walkinggroup.co.uk",
  });
  getOrCreateUserUnsubscribeToken.mockImplementation(async (_id: string, existing: string | null) => existing ?? "generated-token");
  prismaMock.emailTemplateOverride.findUnique.mockResolvedValue(null);
});

describe("sendTestEmail", () => {
  it("sends every registered template to the admin's own address, marked as a test", async () => {
    for (const meta of EMAIL_TEMPLATES) {
      sendEmail.mockClear();
      await sendTestEmail(meta.key, ADMIN);

      expect(sendEmail, meta.key).toHaveBeenCalledTimes(1);
      expect(sendEmail, meta.key).toHaveBeenCalledWith(
        expect.objectContaining({ to: ADMIN.email, subject: expect.stringMatching(/^\[Test\] /) }),
      );
    }
  });

  it("uses the admin's saved override instead of the default, same as a real send", async () => {
    prismaMock.emailTemplateOverride.findUnique.mockResolvedValueOnce({
      subject: "Custom subject",
      body: "Custom body.",
    });

    await sendTestEmail("welcome", ADMIN);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: ADMIN.email, subject: "[Test] Custom subject" }),
    );
  });

  it("mints an unsubscribe token for a preview link, same as a real send would", async () => {
    await sendTestEmail("walkAnnounced", ADMIN);
    expect(getOrCreateUserUnsubscribeToken).toHaveBeenCalledWith("admin-1", null);
  });
});
