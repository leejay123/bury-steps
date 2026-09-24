import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock, syncContactUnsubscribed } = vi.hoisted(() => ({
  prismaMock: {
    newsletterSubscriber: { updateMany: vi.fn(async () => ({ count: 0 })) },
    user: { updateMany: vi.fn(async () => ({ count: 0 })) },
  },
  syncContactUnsubscribed: vi.fn(async () => {}),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/email/resend-audience", () => ({ syncContactUnsubscribed }));

import { optOutNewsletterEverywhere } from "./newsletter-opt-out";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("optOutNewsletterEverywhere", () => {
  it("matches emails case-insensitively across both stores", async () => {
    await optOutNewsletterEverywhere("Jane.Doe@Example.COM");

    const emailMatch = { equals: "jane.doe@example.com", mode: "insensitive" };
    expect(prismaMock.newsletterSubscriber.updateMany).toHaveBeenCalledWith({
      where: { email: emailMatch, unsubscribedAt: null },
      data: { unsubscribedAt: expect.any(Date) },
    });
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { email: emailMatch, emailNewsletter: true },
      data: { emailNewsletter: false },
    });
    expect(syncContactUnsubscribed).toHaveBeenCalledWith("jane.doe@example.com");
  });

  it("no-ops on blank email", async () => {
    await optOutNewsletterEverywhere("   ");
    expect(prismaMock.newsletterSubscriber.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
    expect(syncContactUnsubscribed).not.toHaveBeenCalled();
  });
});
