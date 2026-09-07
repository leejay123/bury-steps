import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RateLimitResult } from "@/lib/rate-limit";

const { checkRateLimit, prismaMock, sendNewsletterSubscribedEmail } = vi.hoisted(() => ({
  checkRateLimit: vi.fn((): RateLimitResult => ({ ok: true })),
  prismaMock: {
    newsletterSubscriber: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
  sendNewsletterSubscribedEmail: vi.fn(async () => {}),
}));

vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/email/mailer", () => ({ sendNewsletterSubscribedEmail }));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.1" })),
}));

import { subscribeToNewsletter, unsubscribeFromNewsletter } from "./newsletter";

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  checkRateLimit.mockReturnValue({ ok: true });
  prismaMock.newsletterSubscriber.upsert.mockResolvedValue({
    email: "jane@example.com",
    unsubscribeToken: "tok123",
  });
});

describe("subscribeToNewsletter", () => {
  it("rejects an invalid email without touching the database", async () => {
    const result = await subscribeToNewsletter(null, form({ email: "not-an-email" }));
    expect(result).toEqual({ ok: false, error: "Enter a valid email address." });
    expect(prismaMock.newsletterSubscriber.upsert).not.toHaveBeenCalled();
  });

  it("silently succeeds without subscribing when the honeypot is filled", async () => {
    const result = await subscribeToNewsletter(
      null,
      form({ email: "jane@example.com", company: "Acme" }),
    );
    expect(result.ok).toBe(true);
    expect(prismaMock.newsletterSubscriber.upsert).not.toHaveBeenCalled();
  });

  it("rate limits repeated attempts", async () => {
    checkRateLimit.mockReturnValue({ ok: false, retryAfterSeconds: 42 });
    const result = await subscribeToNewsletter(null, form({ email: "jane@example.com" }));
    expect(result).toEqual({ ok: false, error: "Too many attempts. Try again in a few minutes." });
  });

  it("upserts the subscriber (clearing a prior unsubscribe) and sends a confirmation", async () => {
    const result = await subscribeToNewsletter(null, form({ email: "jane@example.com" }));

    expect(prismaMock.newsletterSubscriber.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "jane@example.com" },
        create: { email: "jane@example.com" },
        update: { unsubscribedAt: null },
      }),
    );
    expect(sendNewsletterSubscribedEmail).toHaveBeenCalledWith({
      email: "jane@example.com",
      unsubscribeToken: "tok123",
    });
    expect(result.ok).toBe(true);
  });

  it("still reports success if only the confirmation email fails", async () => {
    sendNewsletterSubscribedEmail.mockRejectedValueOnce(new Error("network down"));
    const result = await subscribeToNewsletter(null, form({ email: "jane@example.com" }));
    expect(result.ok).toBe(true);
  });
});

describe("unsubscribeFromNewsletter", () => {
  it("returns true once the row is marked unsubscribed", async () => {
    prismaMock.newsletterSubscriber.update.mockResolvedValueOnce({});
    const ok = await unsubscribeFromNewsletter("tok123");
    expect(ok).toBe(true);
    expect(prismaMock.newsletterSubscriber.update).toHaveBeenCalledWith({
      where: { unsubscribeToken: "tok123" },
      data: { unsubscribedAt: expect.any(Date) },
    });
  });

  it("returns false for an unknown token instead of throwing", async () => {
    prismaMock.newsletterSubscriber.update.mockRejectedValueOnce(new Error("not found"));
    const ok = await unsubscribeFromNewsletter("does-not-exist");
    expect(ok).toBe(false);
  });
});
