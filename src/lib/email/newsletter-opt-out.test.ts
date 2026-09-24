import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock, syncContactUnsubscribed, syncContactSubscribed } = vi.hoisted(() => ({
  prismaMock: {
    newsletterSubscriber: { updateMany: vi.fn(async () => ({ count: 0 })) },
    user: { updateMany: vi.fn(async () => ({ count: 0 })) },
  },
  syncContactUnsubscribed: vi.fn(async () => {}),
  syncContactSubscribed: vi.fn(async () => {}),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/email/resend-audience", () => ({ syncContactUnsubscribed, syncContactSubscribed }));

import { optInNewsletterEverywhere, optOutNewsletterEverywhere } from "./newsletter-opt-out";

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

describe("optInNewsletterEverywhere", () => {
  it("clears footer unsubscribe, turns the member toggle on, and syncs Resend", async () => {
    await optInNewsletterEverywhere("Jane.Doe@Example.COM", "Jane");

    const emailMatch = { equals: "jane.doe@example.com", mode: "insensitive" };
    expect(prismaMock.newsletterSubscriber.updateMany).toHaveBeenCalledWith({
      where: { email: emailMatch, unsubscribedAt: { not: null } },
      data: { unsubscribedAt: null },
    });
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { email: emailMatch, emailNewsletter: false },
      data: { emailNewsletter: true },
    });
    expect(syncContactSubscribed).toHaveBeenCalledWith("jane.doe@example.com", "Jane");
  });

  it("no-ops on blank email", async () => {
    await optInNewsletterEverywhere("   ");
    expect(prismaMock.newsletterSubscriber.updateMany).not.toHaveBeenCalled();
    expect(syncContactSubscribed).not.toHaveBeenCalled();
  });
});
