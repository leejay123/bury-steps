import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { emailEvent: { create: vi.fn(async () => ({})) } },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

// Mirrors svix's real (surprising) behaviour: verify() only checks the
// signature and returns undefined on success, throwing on failure — it
// never returns the parsed payload. This is exactly the assumption the
// route previously got wrong, so the mock has to match reality, not the
// misleading type signature.
const VALID_SECRET = "whsec_test";
vi.mock("svix", () => ({
  Webhook: class {
    constructor(private secret: string) {}
    verify(_payload: string, headers: Record<string, string>) {
      if (this.secret !== VALID_SECRET || !headers["svix-signature"]) {
        throw new Error("invalid signature");
      }
      return undefined;
    }
  },
}));

import { POST } from "./route";

function request(body: string, { signed = true }: { signed?: boolean } = {}): NextRequest {
  return {
    text: async () => body,
    headers: {
      get: (name: string) => {
        if (!signed) return null;
        if (name === "svix-id") return "msg_1";
        if (name === "svix-timestamp") return "1700000000";
        if (name === "svix-signature") return "v1,fakesignature";
        return null;
      },
    },
  } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_WEBHOOK_SECRET = VALID_SECRET;
});

describe("POST /api/webhooks/resend", () => {
  it("returns 500 without RESEND_WEBHOOK_SECRET configured", async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    const res = await POST(request("{}"));
    expect(res.status).toBe(500);
  });

  it("rejects a request with an invalid/missing signature", async () => {
    const res = await POST(request("{}", { signed: false }));
    expect(res.status).toBe(400);
    expect(prismaMock.emailEvent.create).not.toHaveBeenCalled();
  });

  // Regression: verify() returning undefined on success previously crashed
  // this route (TypeError: Cannot read properties of undefined) on every
  // single valid webhook call, since the code read the event straight off
  // verify()'s return value instead of parsing the payload itself.
  it("stores the event from a validly-signed payload, not from verify()'s return value", async () => {
    const body = JSON.stringify({
      type: "email.delivered",
      data: { email_id: "email_123", to: ["jane@example.com"] },
    });

    const res = await POST(request(body));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(prismaMock.emailEvent.create).toHaveBeenCalledWith({
      data: {
        resendId: "email_123",
        type: "email.delivered",
        recipient: "jane@example.com",
        data: { email_id: "email_123", to: ["jane@example.com"] },
      },
    });
  });

  it("still returns 200 if storing the event fails", async () => {
    prismaMock.emailEvent.create.mockRejectedValueOnce(new Error("db down"));
    const body = JSON.stringify({ type: "email.sent", data: {} });

    const res = await POST(request(body));

    expect(res.status).toBe(200);
  });
});
