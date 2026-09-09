import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  prismaMock,
  requireAdmin,
  checkRateLimit,
  sendContactMessageReceivedEmail,
  sendContactMessageAdminAlertEmail,
} = vi.hoisted(() => ({
  prismaMock: {
    contactMessage: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    siteSetting: { findUnique: vi.fn() },
  },
  requireAdmin: vi.fn(),
  checkRateLimit: vi.fn(() => ({ ok: true })),
  sendContactMessageReceivedEmail: vi.fn(async () => {}),
  sendContactMessageAdminAlertEmail: vi.fn(async () => {}),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin };
});
vi.mock("@/lib/email/mailer", () => ({
  sendContactMessageReceivedEmail,
  sendContactMessageAdminAlertEmail,
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: () => null })),
}));

import { deleteContactMessage, markContactMessageRead, submitContactMessage } from "./contact";

function contactForm(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const VALID_FIELDS = {
  name: "Jo Bloggs",
  email: "jo@example.com",
  message: "Hello, this is a real message.",
};

beforeEach(() => {
  vi.clearAllMocks();
  checkRateLimit.mockReturnValue({ ok: true });
  requireAdmin.mockResolvedValue({ id: "admin-1" });
});

describe("submitContactMessage", () => {
  it("alerts the designated contact-messages owner, using their address as the reply-to", async () => {
    prismaMock.contactMessage.create.mockResolvedValueOnce({});
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce({
      contactMessagesOwner: { email: "owner@example.com", role: "ADMIN" },
    });

    const result = await submitContactMessage(null, contactForm(VALID_FIELDS));

    expect(result.ok).toBe(true);
    expect(sendContactMessageAdminAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Jo Bloggs", email: "jo@example.com" }),
      ["owner@example.com"],
    );
  });

  it("alerts no one when no owner has been designated", async () => {
    prismaMock.contactMessage.create.mockResolvedValueOnce({});
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce({ contactMessagesOwner: null });

    await submitContactMessage(null, contactForm(VALID_FIELDS));

    expect(sendContactMessageAdminAlertEmail).not.toHaveBeenCalled();
  });

  it("alerts no one when the site setting row doesn't exist yet", async () => {
    prismaMock.contactMessage.create.mockResolvedValueOnce({});
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce(null);

    await submitContactMessage(null, contactForm(VALID_FIELDS));

    expect(sendContactMessageAdminAlertEmail).not.toHaveBeenCalled();
  });

  it("alerts no one when the designated owner is no longer an organiser", async () => {
    prismaMock.contactMessage.create.mockResolvedValueOnce({});
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce({
      contactMessagesOwner: { email: "demoted@example.com", role: "MEMBER" },
    });

    await submitContactMessage(null, contactForm(VALID_FIELDS));

    expect(sendContactMessageAdminAlertEmail).not.toHaveBeenCalled();
  });

  it("still succeeds for the sender even if looking up the owner throws", async () => {
    prismaMock.contactMessage.create.mockResolvedValueOnce({});
    prismaMock.siteSetting.findUnique.mockRejectedValueOnce(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await submitContactMessage(null, contactForm(VALID_FIELDS));

    expect(result.ok).toBe(true);
  });

  it("rejects an invalid message without saving or notifying anyone", async () => {
    const result = await submitContactMessage(null, contactForm({ ...VALID_FIELDS, message: "short" }));
    expect(result).toEqual({ ok: false, error: "Message needs to be at least 10 characters." });
    expect(prismaMock.contactMessage.create).not.toHaveBeenCalled();
    expect(sendContactMessageAdminAlertEmail).not.toHaveBeenCalled();
  });
});

describe("markContactMessageRead", () => {
  it("requires a message id", async () => {
    const result = await markContactMessageRead(null, contactForm({}));
    expect(result).toEqual({ ok: false, error: "No message selected." });
  });

  it("marks the message read", async () => {
    prismaMock.contactMessage.update.mockResolvedValueOnce({});
    const result = await markContactMessageRead(null, contactForm({ messageId: "msg-1" }));
    expect(prismaMock.contactMessage.update).toHaveBeenCalledWith({
      where: { id: "msg-1" },
      data: { readAt: expect.any(Date) },
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("deleteContactMessage", () => {
  it("requires a message id", async () => {
    const result = await deleteContactMessage(null, contactForm({}));
    expect(result).toEqual({ ok: false, error: "No message selected." });
  });

  it("deletes the message", async () => {
    prismaMock.contactMessage.delete.mockResolvedValueOnce({});
    const result = await deleteContactMessage(null, contactForm({ messageId: "msg-1" }));
    expect(prismaMock.contactMessage.delete).toHaveBeenCalledWith({ where: { id: "msg-1" } });
    expect(result).toEqual({ ok: true, message: "Message removed." });
  });
});
