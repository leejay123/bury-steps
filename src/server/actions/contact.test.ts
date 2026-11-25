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

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
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
  requireAdmin.mockResolvedValue({
    id: "admin-1",
    permWalksView: true,
    permWalksCreate: true,
    permWalksEdit: true,
    permWalksCancel: true,
    permWalksDelete: true,
    permWalksAttendance: true,
    permWalksHealth: true,
    permWalksJourney: true,
    permWalksExport: true,
    permMembersView: true,
    permMembersRemove: true,
    permMessages: true,
    permReports: true,
    permHomepage: true,
    permNotices: true,
    permProgress: true,
    permEmails: true,
    permDisplay: true,
    permCacheReset: true,
  });
});

describe("submitContactMessage", () => {
  it("emails the mailbox for the chosen topic, with the sender as reply-to", async () => {
    prismaMock.contactMessage.create.mockResolvedValueOnce({});
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce({
      contactChairEmail: "chair@example.com",
      contactTreasurerEmail: "treasurer@example.com",
      contactSecretaryEmail: "secretary@example.com",
    });

    const result = await submitContactMessage(null, contactForm({ ...VALID_FIELDS, topic: "TREASURER" }));

    expect(result.ok).toBe(true);
    expect(prismaMock.contactMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ topic: "TREASURER" }),
    });
    expect(sendContactMessageAdminAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Jo Bloggs", email: "jo@example.com", sentTo: "Treasurer" }),
      ["treasurer@example.com"],
    );
  });

  it("sends an unknown or missing topic to the Secretary", async () => {
    prismaMock.contactMessage.create.mockResolvedValueOnce({});
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce({
      contactChairEmail: "chair@example.com",
      contactTreasurerEmail: "treasurer@example.com",
      contactSecretaryEmail: "secretary@example.com",
    });

    await submitContactMessage(null, contactForm({ ...VALID_FIELDS, topic: "SOMETHING" }));

    expect(prismaMock.contactMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ topic: "SECRETARY" }),
    });
    expect(sendContactMessageAdminAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({ sentTo: "Secretary" }),
      ["secretary@example.com"],
    );
  });

  it("uses the built-in address when the settings row doesn't exist yet", async () => {
    prismaMock.contactMessage.create.mockResolvedValueOnce({});
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce(null);

    await submitContactMessage(null, contactForm({ ...VALID_FIELDS, topic: "CHAIR" }));

    expect(sendContactMessageAdminAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({ sentTo: "Chair" }),
      ["chair@burysteps-walkinggroup.co.uk"],
    );
  });

  it("still succeeds for the sender even if looking up the addresses throws", async () => {
    prismaMock.contactMessage.create.mockResolvedValueOnce({});
    prismaMock.siteSetting.findUnique.mockRejectedValueOnce(new Error("db down"));

    const result = await submitContactMessage(null, contactForm(VALID_FIELDS));

    expect(result.ok).toBe(true);
    expect(sendContactMessageAdminAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({ sentTo: "Secretary" }),
      ["secretary@burysteps-walkinggroup.co.uk"],
    );
  });

  it("rejects an invalid message without saving or notifying anyone", async () => {
    const result = await submitContactMessage(null, contactForm({ ...VALID_FIELDS, message: "short" }));
    expect(result).toEqual({ ok: false, error: "Message needs to be at least 10 characters." });
    expect(prismaMock.contactMessage.create).not.toHaveBeenCalled();
    expect(sendContactMessageAdminAlertEmail).not.toHaveBeenCalled();
  });
});

describe("markContactMessageRead", () => {
  it("rejects an organiser without the Messages permission", async () => {
    requireAdmin.mockResolvedValue({
      id: "admin-1",
      permWalksView: true,
      permWalksCreate: true,
      permWalksEdit: true,
      permWalksCancel: true,
      permWalksDelete: true,
      permWalksAttendance: true,
      permWalksHealth: true,
      permWalksJourney: true,
      permWalksExport: true,
      permMembersView: true,
      permMembersRemove: true,
      permMessages: false,
      permReports: true,
      permHomepage: true,
      permNotices: true,
      permProgress: true,
      permEmails: true,
        permDisplay: true,
      permCacheReset: true,
    });
    const result = await markContactMessageRead(null, contactForm({ messageId: "msg-1" }));
    expect(result).toEqual({
      ok: false,
      error: "You do not have permission to manage messages.",
    });
    expect(prismaMock.contactMessage.update).not.toHaveBeenCalled();
  });

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
    expect(result).toEqual({ ok: true, message: "Marked as read." });
  });
});

describe("deleteContactMessage", () => {
  it("rejects an organiser without the Messages permission", async () => {
    requireAdmin.mockResolvedValue({
      id: "admin-1",
      permWalksView: true,
      permWalksCreate: true,
      permWalksEdit: true,
      permWalksCancel: true,
      permWalksDelete: true,
      permWalksAttendance: true,
      permWalksHealth: true,
      permWalksJourney: true,
      permWalksExport: true,
      permMembersView: true,
      permMembersRemove: true,
      permMessages: false,
      permReports: true,
      permHomepage: true,
      permNotices: true,
      permProgress: true,
      permEmails: true,
        permDisplay: true,
      permCacheReset: true,
    });
    const result = await deleteContactMessage(null, contactForm({ messageId: "msg-1" }));
    expect(result).toEqual({
      ok: false,
      error: "You do not have permission to manage messages.",
    });
    expect(prismaMock.contactMessage.delete).not.toHaveBeenCalled();
  });

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
