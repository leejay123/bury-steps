import { describe, expect, it, vi, beforeEach } from "vitest";

const { sendEmail, getEmailBrand, getOrCreateUserUnsubscribeToken } = vi.hoisted(() => ({
  sendEmail: vi.fn(async () => {}),
  getEmailBrand: vi.fn(async () => ({
    siteName: "Bury Steps Walking Group",
    logoUrl: "https://burysteps-walkinggroup.co.uk/bury-steps-logo.png",
    siteUrl: "https://burysteps-walkinggroup.co.uk",
  })),
  getOrCreateUserUnsubscribeToken: vi.fn(async (_id: string, existing: string | null) => existing ?? "generated-token"),
}));

vi.mock("./client", () => ({ sendEmail }));
vi.mock("./brand", () => ({ getEmailBrand }));
vi.mock("./unsubscribe", () => ({
  getOrCreateUserUnsubscribeToken,
  memberPreferencesUrl: (token: string) => `https://burysteps-walkinggroup.co.uk/email-preferences/${token}`,
  newsletterUnsubscribeUrl: (token: string) => `https://burysteps-walkinggroup.co.uk/email-preferences/newsletter/${token}`,
}));

import {
  sendAccidentReportAlertEmail,
  sendAccountDeletedEmail,
  sendAddedToWalkEmail,
  sendAdminPromotedEmail,
  sendContactMessageAdminAlertEmail,
  sendContactMessageReceivedEmail,
  sendNewsletterSubscribedEmail,
  sendWalkAnnouncedEmail,
  sendWalkCancelledEmail,
  sendWelcomeEmail,
} from "./mailer";

const WALK = {
  title: "Sunday stroll",
  whenText: "Sun 7 Sep, 14:30",
  shareUrl: "https://burysteps-walkinggroup.co.uk/w/sunday-stroll",
};

const MEMBER = { id: "user-1", email: "jane@example.com", firstName: "Jane", unsubscribeToken: null };

beforeEach(() => {
  vi.clearAllMocks();
  getEmailBrand.mockResolvedValue({
    siteName: "Bury Steps Walking Group",
    logoUrl: "https://burysteps-walkinggroup.co.uk/bury-steps-logo.png",
    siteUrl: "https://burysteps-walkinggroup.co.uk",
  });
  getOrCreateUserUnsubscribeToken.mockImplementation(async (_id: string, existing: string | null) => existing ?? "generated-token");
});

describe("sendWelcomeEmail", () => {
  it("emails the new member and mints an unsubscribe token", async () => {
    await sendWelcomeEmail(MEMBER);

    expect(getOrCreateUserUnsubscribeToken).toHaveBeenCalledWith("user-1", null);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jane@example.com",
        subject: "Welcome to Bury Steps Walking Group",
      }),
    );
  });
});

describe("sendAccountDeletedEmail", () => {
  it("emails the removed member, no token lookup needed", async () => {
    await sendAccountDeletedEmail({ email: "jane@example.com", firstName: "Jane" });

    expect(getOrCreateUserUnsubscribeToken).not.toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jane@example.com",
        subject: "Your Bury Steps Walking Group account has been deleted",
      }),
    );
  });
});

describe("sendAdminPromotedEmail", () => {
  it("emails the newly promoted organiser", async () => {
    await sendAdminPromotedEmail(MEMBER);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jane@example.com",
        subject: "You're now an organiser of Bury Steps Walking Group",
      }),
    );
  });
});

describe("sendContactMessageReceivedEmail", () => {
  it("confirms receipt to the sender", async () => {
    await sendContactMessageReceivedEmail({
      name: "Jane",
      email: "jane@example.com",
      message: "Hello!",
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "jane@example.com", subject: expect.stringContaining("We've got your message") }),
    );
  });
});

describe("sendContactMessageAdminAlertEmail", () => {
  it("emails every organiser and sets replyTo to the sender", async () => {
    await sendContactMessageAdminAlertEmail(
      { name: "Jane", email: "jane@example.com", phone: null, message: "Hello!" },
      ["admin1@example.com", "admin2@example.com"],
    );

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["admin1@example.com", "admin2@example.com"],
        replyTo: "jane@example.com",
      }),
    );
  });

  it("skips sending when there are no organisers to notify", async () => {
    await sendContactMessageAdminAlertEmail(
      { name: "Jane", email: "jane@example.com", phone: null, message: "Hello!" },
      [],
    );

    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("sendNewsletterSubscribedEmail", () => {
  it("confirms the subscription with a working unsubscribe link", async () => {
    await sendNewsletterSubscribedEmail({ email: "jane@example.com", unsubscribeToken: "tok123" });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "jane@example.com", subject: expect.stringContaining("subscribed") }),
    );
  });
});

describe("sendWalkAnnouncedEmail", () => {
  it("emails the member about the new walk", async () => {
    await sendWalkAnnouncedEmail(
      { ...WALK, durationText: "1 hour 30 minutes", meetingPoint: "Burrs Country Park", what3words: null },
      MEMBER,
    );

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "jane@example.com", subject: "New walk: Sunday stroll" }),
    );
  });
});

describe("sendWalkCancelledEmail", () => {
  it("emails the member about the cancellation", async () => {
    await sendWalkCancelledEmail({ ...WALK, reason: "Bad weather" }, MEMBER);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "jane@example.com", subject: "Walk cancelled: Sunday stroll" }),
    );
  });
});

describe("sendAddedToWalkEmail", () => {
  it("emails the member they were added", async () => {
    await sendAddedToWalkEmail({ ...WALK, meetingPoint: null }, MEMBER);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "jane@example.com", subject: "You've been added to Sunday stroll" }),
    );
  });
});

describe("sendAccidentReportAlertEmail", () => {
  it("emails every other organiser", async () => {
    await sendAccidentReportAlertEmail(
      {
        whenText: "5 Jan 2026, 14:00",
        walkTitle: "Sunday stroll",
        whoInvolved: "A member",
        createdByName: "Jane Admin",
      },
      ["admin1@example.com", "admin2@example.com"],
    );

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["admin1@example.com", "admin2@example.com"],
        subject: "New accident report logged",
      }),
    );
  });

  it("skips sending when there's no one else to notify", async () => {
    await sendAccidentReportAlertEmail(
      { whenText: "5 Jan 2026, 14:00", walkTitle: null, whoInvolved: "A member", createdByName: "Jane Admin" },
      [],
    );

    expect(sendEmail).not.toHaveBeenCalled();
  });
});
