import { describe, expect, it, vi, beforeEach } from "vitest";
import { ClerkAPIResponseError } from "@clerk/nextjs/errors";
import type { RateLimitResult } from "@/lib/rate-limit";

const { requireAdmin, checkRateLimit, actorTokensCreate, prismaMock } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  checkRateLimit: vi.fn((): RateLimitResult => ({ ok: true })),
  actorTokensCreate: vi.fn(),
  prismaMock: {
    user: { findUnique: vi.fn() },
    impersonationEvent: { create: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn(async () => ({ actorTokens: { create: actorTokensCreate } })),
}));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin };
});

import { startImpersonation } from "./impersonation";

const ADMIN = { id: "admin-1", clerkId: "clerk-admin-1", email: "admin@example.com", firstName: "Ada", lastName: "Min" };
const MEMBER = {
  id: "member-1",
  clerkId: "clerk-member-1",
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
  role: "MEMBER",
};

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  checkRateLimit.mockReturnValue({ ok: true });
  requireAdmin.mockResolvedValue(ADMIN);
});

describe("startImpersonation", () => {
  it("rejects a missing target", async () => {
    const result = await startImpersonation(null, form({}));
    expect(result).toEqual({ ok: false, error: "No member selected." });
  });

  it("refuses to let an admin impersonate themselves", async () => {
    const result = await startImpersonation(null, form({ targetId: ADMIN.id }));
    expect(result).toEqual({ ok: false, error: "You can't log in as yourself." });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("reports a missing member without creating an actor token", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const result = await startImpersonation(null, form({ targetId: "gone" }));
    expect(result).toEqual({ ok: false, error: "That member is no longer in the group." });
    expect(actorTokensCreate).not.toHaveBeenCalled();
  });

  it("refuses to let an admin impersonate another organiser", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ ...MEMBER, role: "ADMIN" });
    const result = await startImpersonation(null, form({ targetId: "other-admin" }));
    expect(result).toEqual({
      ok: false,
      error: "You can only log in as a member, not another organiser.",
    });
    expect(actorTokensCreate).not.toHaveBeenCalled();
  });

  it("rate limits repeated attempts", async () => {
    checkRateLimit.mockReturnValue({ ok: false, retryAfterSeconds: 30 });
    const result = await startImpersonation(null, form({ targetId: MEMBER.id }));
    expect(result).toEqual({ ok: false, error: "Too many attempts. Try again in 30s." });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("creates an actor token, logs the event, and returns its url as href", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(MEMBER);
    actorTokensCreate.mockResolvedValueOnce({ url: "https://clerk.example/actor/abc" });

    const result = await startImpersonation(null, form({ targetId: MEMBER.id }));

    expect(actorTokensCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: MEMBER.clerkId,
        actor: { sub: ADMIN.clerkId },
      }),
    );
    expect(prismaMock.impersonationEvent.create).toHaveBeenCalledWith({
      data: {
        adminId: ADMIN.id,
        adminName: "Ada Min",
        adminEmail: ADMIN.email,
        targetId: MEMBER.id,
        targetName: "Jane Doe",
        targetEmail: MEMBER.email,
      },
    });
    expect(result).toEqual({
      ok: true,
      message: "Signed in as Jane Doe.",
      href: "https://clerk.example/actor/abc",
    });
  });

  it("reports an error if Clerk doesn't return a sign-in url", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(MEMBER);
    actorTokensCreate.mockResolvedValueOnce({ url: null });

    const result = await startImpersonation(null, form({ targetId: MEMBER.id }));

    expect(result).toEqual({ ok: false, error: "Clerk did not return a sign-in link. Try again." });
  });

  it("reports a generic failure if Clerk's API call throws", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(MEMBER);
    actorTokensCreate.mockRejectedValueOnce(new Error("network down"));

    const result = await startImpersonation(null, form({ targetId: MEMBER.id }));

    expect(result).toEqual({ ok: false, error: "Could not log in as that member. Try again." });
  });

  // Clerk plans cap actor-token sign-ins per billing period — surfacing
  // Clerk's own explanation (which names the limit and reset timing)
  // instead of the generic fallback is the whole point, since "try again"
  // would be actively misleading for a quota that resets monthly.
  it("surfaces Clerk's own message when the impersonation plan limit is hit", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(MEMBER);
    actorTokensCreate.mockRejectedValueOnce(
      new ClerkAPIResponseError("Unprocessable Entity", {
        status: 422,
        data: [
          {
            code: "impersonation_limit_exceeded",
            message: "limit exceeded",
            long_message:
              "Your application has reached the impersonation limit for your plan (5/5). The limit will reset at the beginning of the next billing period.",
          },
        ],
      }),
    );

    const result = await startImpersonation(null, form({ targetId: MEMBER.id }));

    expect(result).toEqual({
      ok: false,
      error:
        "Your application has reached the impersonation limit for your plan (5/5). The limit will reset at the beginning of the next billing period.",
    });
  });
});
