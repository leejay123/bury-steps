import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RateLimitResult } from "@/lib/rate-limit";

const {
  revalidatePath,
  revalidateTag,
  requireAdmin,
  checkRateLimit,
  getUserList,
  deleteUser,
  transaction,
} = vi.hoisted(() => {
  // resetSiteToDefault's transaction touches a dozen-plus prisma models —
  // stub every model.method() call it could make with a Proxy two levels
  // deep (tx.<model>.<method>(...)) rather than declaring each one by hand.
  const transaction = vi.fn(async (arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    const modelStub = () =>
      new Proxy(
        {},
        {
          get: () => vi.fn().mockResolvedValue({}),
        },
      );
    const tx = new Proxy(
      {},
      {
        get: () => modelStub(),
      },
    );
    return (arg as (tx: unknown) => unknown)(tx);
  });
  return {
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    requireAdmin: vi.fn(),
    checkRateLimit: vi.fn((): RateLimitResult => ({ ok: true })),
    getUserList: vi.fn(),
    deleteUser: vi.fn(),
    transaction,
  };
});

vi.mock("next/cache", () => ({
  revalidatePath,
  revalidateTag,
  // @/lib/site-notices calls this at module-load time (for NOTICES_CACHE_TAG's
  // sibling export); a passthrough is enough since nothing here calls it.
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("@/lib/db", () => ({ prisma: { $transaction: transaction } }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn(async () => ({ users: { getUserList, deleteUser } })),
}));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin };
});

import { clearSiteCache, resetSiteToDefault } from "./admin-cache";

const ADMIN = { id: "admin-1", clerkId: "clerk-admin-1" };

function resetForm(confirm: string): FormData {
  const formData = new FormData();
  formData.set("confirm", confirm);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue(ADMIN);
  checkRateLimit.mockReturnValue({ ok: true });
  getUserList.mockResolvedValue({ data: [] });
});

describe("clearSiteCache", () => {
  it("revalidates both cache tags and the public/admin/dashboard routes", async () => {
    const result = await clearSiteCache(null, new FormData());
    expect(revalidateTag).toHaveBeenCalledWith("homepage");
    expect(revalidateTag).toHaveBeenCalledWith(expect.any(String));
    expect(revalidateTag).toHaveBeenCalledTimes(2);
    for (const path of ["/", "/home", "/admin", "/dashboard"]) {
      expect(revalidatePath).toHaveBeenCalledWith(path);
    }
    expect(result.ok).toBe(true);
  });
});

describe("resetSiteToDefault", () => {
  it("refuses without the exact confirm word", async () => {
    const result = await resetSiteToDefault(null, resetForm("yes please"));
    expect(result).toEqual({ ok: false, error: "Type delete to confirm, then try again." });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("accepts the confirm word case-insensitively and with surrounding whitespace", async () => {
    const result = await resetSiteToDefault(null, resetForm("  DELETE  "));
    expect(result.ok).toBe(true);
  });

  it("rejects when the admin is rate-limited (guards against repeated accidental resets)", async () => {
    checkRateLimit.mockReturnValueOnce({ ok: false, retryAfterSeconds: 300 });
    const result = await resetSiteToDefault(null, resetForm("delete"));
    expect(result).toEqual({ ok: false, error: "Try again in a few minutes." });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("reports failure and never touches Clerk if the database wipe itself fails", async () => {
    transaction.mockRejectedValueOnce(new Error("db exploded"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await resetSiteToDefault(null, resetForm("delete"));

    expect(result).toEqual({ ok: false, error: "Could not reset the site. Try again." });
    expect(getUserList).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("never deletes the acting admin's own Clerk account", async () => {
    getUserList.mockResolvedValueOnce({
      data: [{ id: ADMIN.clerkId }, { id: "clerk-member-1" }],
    });
    deleteUser.mockResolvedValueOnce(undefined);

    await resetSiteToDefault(null, resetForm("delete"));

    expect(deleteUser).toHaveBeenCalledTimes(1);
    expect(deleteUser).toHaveBeenCalledWith("clerk-member-1");
    expect(deleteUser).not.toHaveBeenCalledWith(ADMIN.clerkId);
  });

  it("paginates through every page of Clerk users, not just the first 100", async () => {
    const page1 = { data: Array.from({ length: 100 }, (_, i) => ({ id: `clerk-${i}` })) };
    const page2 = { data: [{ id: "clerk-last" }] };
    getUserList.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);
    deleteUser.mockResolvedValue(undefined);

    await resetSiteToDefault(null, resetForm("delete"));

    expect(getUserList).toHaveBeenCalledTimes(2);
    expect(getUserList).toHaveBeenNthCalledWith(1, { limit: 100, offset: 0 });
    expect(getUserList).toHaveBeenNthCalledWith(2, { limit: 100, offset: 100 });
    expect(deleteUser).toHaveBeenCalledWith("clerk-last");
  });

  it("treats an already-gone Clerk account (404) as fine, not a failure", async () => {
    getUserList.mockResolvedValueOnce({ data: [{ id: "clerk-member-1" }] });
    deleteUser.mockRejectedValueOnce({ status: 404 });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await resetSiteToDefault(null, resetForm("delete"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).not.toContain("could not be revoked");
    }
  });

  it("still reports overall success but warns when some Clerk logins couldn't be revoked", async () => {
    getUserList.mockResolvedValueOnce({ data: [{ id: "clerk-member-1" }] });
    deleteUser.mockRejectedValueOnce(new Error("Clerk API down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await resetSiteToDefault(null, resetForm("delete"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toContain("could not be revoked automatically");
    }
  });

  it("still resets the database and reports success even if listing Clerk users fails entirely", async () => {
    getUserList.mockRejectedValueOnce(new Error("Clerk is down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await resetSiteToDefault(null, resetForm("delete"));
    expect(transaction).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toContain("could not be revoked automatically");
    }
  });

  it("revalidates the public and admin routes on a clean reset", async () => {
    await resetSiteToDefault(null, resetForm("delete"));
    for (const path of ["/", "/home", "/admin", "/admin/members", "/dashboard"]) {
      expect(revalidatePath).toHaveBeenCalledWith(path);
    }
  });
});
