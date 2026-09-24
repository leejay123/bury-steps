import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RateLimitResult } from "@/lib/rate-limit";

const {
  checkRateLimit,
  prismaMock,
  sendNewsletterSubscribedEmail,
  syncContactSubscribed,
  syncContactUnsubscribed,
  getOrCreateAudienceId,
  getResendClient,
  requireAdmin,
  broadcastsCreate,
} = vi.hoisted(() => ({
  checkRateLimit: vi.fn((): RateLimitResult => ({ ok: true })),
  prismaMock: {
    newsletterSubscriber: {
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
  sendNewsletterSubscribedEmail: vi.fn(async () => {}),
  syncContactSubscribed: vi.fn(async () => {}),
  syncContactUnsubscribed: vi.fn(async () => {}),
  getOrCreateAudienceId: vi.fn(async () => "aud-1"),
  getResendClient: vi.fn(),
  requireAdmin: vi.fn(),
  broadcastsCreate: vi.fn(async () => ({ error: null })),
}));

vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/site-owner", () => ({ actorStillOwner: vi.fn(async () => true) }));
vi.mock("@/lib/email/mailer", () => ({ sendNewsletterSubscribedEmail }));
vi.mock("@/lib/email/resend-audience", () => ({
  syncContactSubscribed,
  syncContactUnsubscribed,
  getOrCreateAudienceId,
}));
vi.mock("@/lib/email/client", () => ({
  getResendClient,
  fromAddress: () => "newsletter@example.com",
}));
vi.mock("@/lib/email/brand", () => ({
  getEmailBrand: vi.fn(async () => ({
    siteName: "Bury Steps",
    primaryColor: "#000",
    logoUrl: null,
  })),
}));
vi.mock("@/lib/email/newsletter-opt-out", () => ({
  optOutNewsletterEverywhere: vi.fn(async () => {}),
  optInNewsletterEverywhere: vi.fn(async () => {}),
}));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin };
});
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.1" })),
}));

import {
  sendNewsletterCampaign,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
} from "./newsletter";
import { optInNewsletterEverywhere, optOutNewsletterEverywhere } from "@/lib/email/newsletter-opt-out";

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const ADMIN = {
  id: "admin-1",
  permSubscribers: true,
};

/** loadCampaignRecipients hits findMany three times (active footer, members, opted-out footer). */
function mockCampaignLists(opts: {
  activeFooter?: { email: string }[];
  members?: { email: string; firstName: string | null }[];
  optedOutFooter?: { email: string }[];
}) {
  const activeFooter = opts.activeFooter ?? [];
  const members = opts.members ?? [];
  const optedOutFooter = opts.optedOutFooter ?? [];
  prismaMock.newsletterSubscriber.findMany
    .mockResolvedValueOnce(activeFooter)
    .mockResolvedValueOnce(optedOutFooter);
  prismaMock.user.findMany.mockResolvedValueOnce(members);
}

beforeEach(() => {
  vi.clearAllMocks();
  checkRateLimit.mockReturnValue({ ok: true });
  requireAdmin.mockResolvedValue(ADMIN);
  getOrCreateAudienceId.mockResolvedValue("aud-1");
  getResendClient.mockReturnValue({ broadcasts: { create: broadcastsCreate } });
  broadcastsCreate.mockResolvedValue({ error: null });
  prismaMock.newsletterSubscriber.create.mockResolvedValue({
    email: "jane@example.com",
    unsubscribeToken: "tok123",
  });
  prismaMock.newsletterSubscriber.updateMany.mockResolvedValue({ count: 0 });
});

describe("subscribeToNewsletter", () => {
  it("rejects an invalid email without touching the database", async () => {
    const result = await subscribeToNewsletter(null, form({ email: "not-an-email" }));
    expect(result).toEqual({ ok: false, error: "Enter a valid email address." });
    expect(prismaMock.newsletterSubscriber.create).not.toHaveBeenCalled();
  });

  it("silently succeeds without subscribing when the honeypot is filled", async () => {
    const result = await subscribeToNewsletter(
      null,
      form({ email: "jane@example.com", company: "Acme" }),
    );
    expect(result.ok).toBe(true);
    expect(prismaMock.newsletterSubscriber.create).not.toHaveBeenCalled();
  });

  it("rate limits repeated attempts", async () => {
    checkRateLimit.mockReturnValue({ ok: false, retryAfterSeconds: 42 });
    const result = await subscribeToNewsletter(null, form({ email: "jane@example.com" }));
    expect(result).toEqual({ ok: false, error: "Too many attempts. Try again in a few minutes." });
  });

  it("creates a new subscriber and sends a confirmation", async () => {
    const result = await subscribeToNewsletter(null, form({ email: "jane@example.com" }));

    expect(prismaMock.newsletterSubscriber.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { email: "jane@example.com", unsubscribeToken: expect.any(String) },
      }),
    );
    expect(sendNewsletterSubscribedEmail).toHaveBeenCalledWith({
      email: "jane@example.com",
      unsubscribeToken: "tok123",
    });
    expect(syncContactSubscribed).toHaveBeenCalledWith("jane@example.com");
    expect(optInNewsletterEverywhere).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });

  it("still reports success if only the confirmation email fails", async () => {
    sendNewsletterSubscribedEmail.mockRejectedValueOnce(new Error("network down"));
    const result = await subscribeToNewsletter(null, form({ email: "jane@example.com" }));
    expect(result.ok).toBe(true);
  });

  it("tells an already-active subscriber they're already on the list, without re-sending the email", async () => {
    prismaMock.newsletterSubscriber.create.mockRejectedValueOnce({ code: "P2002" });
    prismaMock.newsletterSubscriber.updateMany.mockResolvedValueOnce({ count: 0 });

    const result = await subscribeToNewsletter(null, form({ email: "jane@example.com" }));

    expect(result).toEqual({ ok: true, message: "You're already subscribed — thanks!" });
    expect(prismaMock.newsletterSubscriber.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "jane@example.com", unsubscribedAt: { not: null } },
      }),
    );
    expect(sendNewsletterSubscribedEmail).not.toHaveBeenCalled();
  });

  it("resubscribes (and emails) someone who had previously unsubscribed", async () => {
    prismaMock.newsletterSubscriber.create.mockRejectedValueOnce({ code: "P2002" });
    prismaMock.newsletterSubscriber.updateMany.mockResolvedValueOnce({ count: 1 });

    const result = await subscribeToNewsletter(null, form({ email: "jane@example.com" }));

    expect(prismaMock.newsletterSubscriber.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { unsubscribedAt: null, unsubscribeToken: expect.any(String) },
      }),
    );
    expect(sendNewsletterSubscribedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: "jane@example.com", unsubscribeToken: expect.any(String) }),
    );
    expect(result.ok).toBe(true);
  });
});

describe("unsubscribeFromNewsletter", () => {
  it("returns true once the row is marked unsubscribed", async () => {
    prismaMock.newsletterSubscriber.updateMany.mockReset();
    prismaMock.newsletterSubscriber.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.newsletterSubscriber.findUnique.mockResolvedValueOnce({ email: "jane@example.com" });
    const ok = await unsubscribeFromNewsletter("tok123");
    expect(ok).toBe(true);
    expect(prismaMock.newsletterSubscriber.updateMany).toHaveBeenCalledWith({
      where: { unsubscribeToken: "tok123", unsubscribedAt: null },
      data: { unsubscribedAt: expect.any(Date) },
    });
    expect(optOutNewsletterEverywhere).toHaveBeenCalledWith("jane@example.com");
  });

  it("returns true idempotently when already unsubscribed", async () => {
    prismaMock.newsletterSubscriber.updateMany.mockReset();
    prismaMock.newsletterSubscriber.updateMany.mockResolvedValueOnce({ count: 0 });
    prismaMock.newsletterSubscriber.findUnique.mockResolvedValueOnce({
      email: "jane@example.com",
      unsubscribedAt: new Date(),
    });
    const ok = await unsubscribeFromNewsletter("tok123");
    expect(ok).toBe(true);
    expect(optOutNewsletterEverywhere).toHaveBeenCalledWith("jane@example.com");
  });

  it("returns false for an unknown token instead of throwing", async () => {
    prismaMock.newsletterSubscriber.updateMany.mockReset();
    prismaMock.newsletterSubscriber.updateMany.mockResolvedValueOnce({ count: 0 });
    prismaMock.newsletterSubscriber.findUnique.mockResolvedValueOnce(null);
    const ok = await unsubscribeFromNewsletter("does-not-exist");
    expect(ok).toBe(false);
  });
});

describe("sendNewsletterCampaign", () => {
  it("includes footer subscribers even when their User.emailNewsletter is default-off", async () => {
    // Initial load + per-chunk refresh + final purge load.
    mockCampaignLists({
      activeFooter: [{ email: "footer@example.com" }],
      members: [],
      optedOutFooter: [],
    });
    mockCampaignLists({
      activeFooter: [{ email: "footer@example.com" }],
      members: [],
      optedOutFooter: [],
    });
    mockCampaignLists({
      activeFooter: [{ email: "footer@example.com" }],
      members: [],
      optedOutFooter: [],
    });

    const result = await sendNewsletterCampaign(
      null,
      form({ subject: "Hello", body: "News" }),
    );

    expect(result).toEqual({ ok: true, message: "Newsletter sent." });
    expect(syncContactSubscribed).toHaveBeenCalledWith("footer@example.com", null);
    expect(syncContactUnsubscribed).not.toHaveBeenCalled();
    expect(broadcastsCreate).toHaveBeenCalled();
  });

  it("does not treat default-off member prefs as a block on a dual-listed footer address", async () => {
    // Same email on active footer; member toggle is false so they are absent
    // from the members query — must still sync from the footer list.
    mockCampaignLists({
      activeFooter: [{ email: "both@example.com" }],
      members: [],
      optedOutFooter: [],
    });
    mockCampaignLists({
      activeFooter: [{ email: "both@example.com" }],
      members: [],
      optedOutFooter: [],
    });
    mockCampaignLists({
      activeFooter: [{ email: "both@example.com" }],
      members: [],
      optedOutFooter: [],
    });

    await sendNewsletterCampaign(null, form({ subject: "Hello", body: "News" }));

    expect(syncContactSubscribed).toHaveBeenCalledWith("both@example.com", null);
  });

  it("skips force-subscribe and purges Resend when a recipient opted out mid-send", async () => {
    mockCampaignLists({
      activeFooter: [{ email: "gone@example.com" }],
      members: [],
      optedOutFooter: [],
    });
    // Chunk refresh: they unsubscribed between snapshot and sync.
    mockCampaignLists({
      activeFooter: [],
      members: [],
      optedOutFooter: [{ email: "gone@example.com" }],
    });
    // Final purge load.
    mockCampaignLists({
      activeFooter: [],
      members: [],
      optedOutFooter: [{ email: "gone@example.com" }],
    });

    await sendNewsletterCampaign(null, form({ subject: "Hello", body: "News" }));

    expect(syncContactSubscribed).not.toHaveBeenCalled();
    expect(syncContactUnsubscribed).toHaveBeenCalledWith("gone@example.com");
  });

  it("skips members whose footer row is unsubscribed (mirror-lag defense)", async () => {
    mockCampaignLists({
      activeFooter: [],
      members: [{ email: "stale@example.com", firstName: "Sam" }],
      optedOutFooter: [{ email: "stale@example.com" }],
    });
    mockCampaignLists({
      activeFooter: [],
      members: [{ email: "stale@example.com", firstName: "Sam" }],
      optedOutFooter: [{ email: "stale@example.com" }],
    });

    await sendNewsletterCampaign(null, form({ subject: "Hello", body: "News" }));

    expect(syncContactSubscribed).not.toHaveBeenCalled();
    expect(syncContactUnsubscribed).toHaveBeenCalledWith("stale@example.com");
  });
});
