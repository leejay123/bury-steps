import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { send, batchSend, ResendMock } = vi.hoisted(() => {
  const send = vi.fn(async (): Promise<{ data: { id: string } | null; error: { message: string } | null }> => ({
    data: { id: "email_1" },
    error: null,
  }));
  const batchSend = vi.fn(
    async (
      _payload?: unknown[],
      _options?: unknown,
    ): Promise<{
      data: { data: { id: string }[]; errors?: { index: number; message: string }[] } | null;
      error: { message: string } | null;
    }> => ({
      data: { data: [{ id: "email_1" }] },
      error: null,
    }),
  );
  // A plain function, not an arrow function — `new Resend(...)` in client.ts
  // needs something constructible, and arrow functions have no [[Construct]].
  const ResendMock = vi.fn(function ResendCtor() {
    return { emails: { send }, batch: { send: batchSend } };
  });
  return { send, batchSend, ResendMock };
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

describe("sendEmailBatch", () => {
  function input(to: string) {
    return { to, subject: "New walk", react: null as never };
  }

  it("does nothing for an empty list", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const { sendEmailBatch } = await import("./client");

    const result = await sendEmailBatch([]);

    expect(batchSend).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, failed: 0 });
  });

  it("skips and warns instead of throwing when RESEND_API_KEY is unset", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { sendEmailBatch } = await import("./client");

    const result = await sendEmailBatch([input("a@example.com")]);

    expect(batchSend).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("RESEND_API_KEY not set"));
    expect(result).toEqual({ sent: 0, failed: 1 });
  });

  it("sends everything in one call when under the 100-recipient chunk size", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "Bury Steps <notices@example.com>";
    batchSend.mockResolvedValueOnce({ data: { data: [{ id: "1" }, { id: "2" }] }, error: null });
    const { sendEmailBatch } = await import("./client");

    const result = await sendEmailBatch([input("a@example.com"), input("b@example.com")]);

    expect(batchSend).toHaveBeenCalledTimes(1);
    expect(batchSend).toHaveBeenCalledWith(
      [
        expect.objectContaining({ from: "Bury Steps <notices@example.com>", to: ["a@example.com"] }),
        expect.objectContaining({ to: ["b@example.com"] }),
      ],
      expect.objectContaining({ batchValidation: "permissive" }),
    );
    expect(result).toEqual({ sent: 2, failed: 0 });
  });

  it("splits more than 100 recipients into multiple chunks, paced apart", async () => {
    vi.useFakeTimers();
    process.env.RESEND_API_KEY = "re_test";
    const inputs = Array.from({ length: 120 }, (_, i) => input(`member${i}@example.com`));
    batchSend
      .mockResolvedValueOnce({ data: { data: Array.from({ length: 100 }, () => ({ id: "x" })) }, error: null })
      .mockResolvedValueOnce({ data: { data: Array.from({ length: 20 }, () => ({ id: "x" })) }, error: null });
    const { sendEmailBatch } = await import("./client");

    const resultPromise = sendEmailBatch(inputs);
    // First chunk has gone out; the loop is now paused before the second.
    await vi.advanceTimersByTimeAsync(0);
    expect(batchSend).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(500);
    const result = await resultPromise;

    expect(batchSend).toHaveBeenCalledTimes(2);
    expect(batchSend.mock.calls[0][0]).toHaveLength(100);
    expect(batchSend.mock.calls[1][0]).toHaveLength(20);
    expect(result).toEqual({ sent: 120, failed: 0 });
    vi.useRealTimers();
  });

  it("uses one idempotency key per chunk, not per email", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const { sendEmailBatch } = await import("./client");

    await sendEmailBatch([input("a@example.com")], { idempotencyKeyPrefix: "progress-summary/2026-08" });

    expect(batchSend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ idempotencyKey: "progress-summary/2026-08/0" }),
    );
  });

  it("counts a whole rejected chunk as failed rather than throwing", async () => {
    process.env.RESEND_API_KEY = "re_test";
    batchSend.mockResolvedValueOnce({ data: null, error: { message: "invalid domain" } });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendEmailBatch } = await import("./client");

    const result = await sendEmailBatch([input("a@example.com"), input("b@example.com")]);

    expect(result).toEqual({ sent: 0, failed: 2 });
    expect(error).toHaveBeenCalled();
  });

  it("counts only the permissive-mode per-item failures, not the whole chunk", async () => {
    process.env.RESEND_API_KEY = "re_test";
    batchSend.mockResolvedValueOnce({
      data: { data: [{ id: "1" }], errors: [{ index: 1, message: "invalid address" }] },
      error: null,
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendEmailBatch } = await import("./client");

    const result = await sendEmailBatch([input("a@example.com"), input("bad")]);

    expect(result).toEqual({ sent: 1, failed: 1 });
    expect(error).toHaveBeenCalledWith(expect.stringContaining("bad"), "invalid address");
  });

  it("logs rather than throwing when the batch call itself rejects", async () => {
    process.env.RESEND_API_KEY = "re_test";
    batchSend.mockRejectedValueOnce(new Error("network down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendEmailBatch } = await import("./client");

    const result = await sendEmailBatch([input("a@example.com")]);

    expect(result).toEqual({ sent: 0, failed: 1 });
    expect(error).toHaveBeenCalled();
  });
});
