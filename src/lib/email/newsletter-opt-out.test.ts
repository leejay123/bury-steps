import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock, syncContactUnsubscribed, syncContactSubscribed } = vi.hoisted(() => ({
  prismaMock: {
    newsletterSubscriber: { updateMany: vi.fn(async () => ({ count: 0 })) },
    user: {
      updateMany: vi.fn(async () => ({ count: 0 })),
      findFirst: vi.fn(),
    },
  },
  syncContactUnsubscribed: vi.fn(async () => {}),
  syncContactSubscribed: vi.fn(async () => {}),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/email/resend-audience", () => ({ syncContactUnsubscribed, syncContactSubscribed }));

import {
  optInNewsletterEverywhere,
  optOutNewsletterEverywhere,
  syncNewsletterAudienceToPreference,
} from "./newsletter-opt-out";

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

describe("syncNewsletterAudienceToPreference", () => {
  const emailMatch = { equals: "a@example.com", mode: "insensitive" };

  it("opts Resend and footer out when the saved preference is off", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({ emailNewsletter: false });

    await syncNewsletterAudienceToPreference("a@example.com");

    expect(prismaMock.newsletterSubscriber.updateMany).toHaveBeenCalledWith({
      where: { email: emailMatch, unsubscribedAt: null },
      data: { unsubscribedAt: expect.any(Date) },
    });
    expect(syncContactUnsubscribed).toHaveBeenCalledWith("a@example.com");
    expect(syncContactSubscribed).not.toHaveBeenCalled();
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  it("opts in when the saved preference is on and still on at Resend time", async () => {
    prismaMock.user.findFirst
      .mockResolvedValueOnce({ emailNewsletter: true })
      .mockResolvedValueOnce({ id: "user-1" });

    await syncNewsletterAudienceToPreference("a@example.com", "Ada");

    expect(prismaMock.newsletterSubscriber.updateMany).toHaveBeenCalledWith({
      where: { email: emailMatch, unsubscribedAt: { not: null } },
      data: { unsubscribedAt: null },
    });
    expect(syncContactSubscribed).toHaveBeenCalledWith("a@example.com", "Ada");
  });

  it("aborts Resend subscribe if a concurrent save opted out", async () => {
    prismaMock.user.findFirst
      .mockResolvedValueOnce({ emailNewsletter: true })
      .mockResolvedValueOnce(null);

    await syncNewsletterAudienceToPreference("a@example.com", "Ada");

    expect(syncContactSubscribed).not.toHaveBeenCalled();
    expect(syncContactUnsubscribed).toHaveBeenCalledWith("a@example.com");
  });
});
