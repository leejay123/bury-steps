import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { send, ResendMock } = vi.hoisted(() => {
  const send = vi.fn(async (): Promise<{ data: { id: string } | null; error: { message: string } | null }> => ({
    data: { id: "email_1" },
    error: null,
  }));
  // A plain function, not an arrow function — `new Resend(...)` in client.ts
  // needs something constructible, and arrow functions have no [[Construct]].
  const ResendMock = vi.fn(function ResendCtor() {
    return { emails: { send } };
  });
  return { send, ResendMock };
});

vi.mock("resend", () => ({ Resend: ResendMock }));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("sendEmail", () => {
  it("skips and warns instead of throwing when RESEND_API_KEY is unset", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { sendEmail } = await import("./client");

    await sendEmail({ to: "member@example.com", subject: "Hi", react: null as never });

    expect(send).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("RESEND_API_KEY not set"));
  });

  it("reports as not configured without an API key, configured with one", async () => {
    const { isEmailConfigured: withoutKey } = await import("./client");
    expect(withoutKey()).toBe(false);

    process.env.RESEND_API_KEY = "re_test";
    vi.resetModules();
    const { isEmailConfigured: withKey } = await import("./client");
    expect(withKey()).toBe(true);
  });

  it("sends through Resend using EMAIL_FROM when configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "Bury Steps <notices@example.com>";
    const { sendEmail } = await import("./client");

    await sendEmail({ to: "member@example.com", subject: "Hi", react: null as never });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Bury Steps <notices@example.com>",
        to: ["member@example.com"],
        subject: "Hi",
      }),
      undefined,
    );
  });

  it("falls back to the Resend test sender when EMAIL_FROM is unset", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const { sendEmail } = await import("./client");

    await sendEmail({ to: "member@example.com", subject: "Hi", react: null as never });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ from: expect.stringContaining("onboarding@resend.dev") }),
      undefined,
    );
  });

  it("passes idempotencyKey through as Resend's second argument when given", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const { sendEmail } = await import("./client");

    await sendEmail({
      to: "member@example.com",
      subject: "Hi",
      react: null as never,
      idempotencyKey: "welcome/user-1",
    });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Hi" }),
      { idempotencyKey: "welcome/user-1" },
    );
  });

  it("logs rather than throwing when Resend rejects the send", async () => {
    process.env.RESEND_API_KEY = "re_test";
    send.mockResolvedValueOnce({ data: null, error: { message: "invalid domain" } });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendEmail } = await import("./client");

    await expect(
      sendEmail({ to: "member@example.com", subject: "Hi", react: null as never }),
    ).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
  });

  it("logs rather than throwing when the Resend call itself rejects", async () => {
    process.env.RESEND_API_KEY = "re_test";
    send.mockRejectedValueOnce(new Error("network down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendEmail } = await import("./client");

    await expect(
      sendEmail({ to: "member@example.com", subject: "Hi", react: null as never }),
    ).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
  });
});
