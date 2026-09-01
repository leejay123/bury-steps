import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RateLimitResult } from "@/lib/rate-limit";

const { revalidatePath, requireAdmin, requireUser, checkRateLimit, recordSiteNoticeRead, prismaMock, transaction } =
  vi.hoisted(() => {
    const prismaMock: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
      siteNotice: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      siteNoticeRead: { deleteMany: vi.fn(), createMany: vi.fn() },
      siteNoticeCategory: {
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    };
    const transaction = vi.fn(async (arg: unknown) => {
      if (Array.isArray(arg)) return Promise.all(arg);
      return (arg as (tx: unknown) => unknown)({ $executeRawUnsafe: vi.fn(), ...prismaMock });
    });
    return {
      revalidatePath: vi.fn(),
      requireAdmin: vi.fn(),
      requireUser: vi.fn(),
      checkRateLimit: vi.fn((): RateLimitResult => ({ ok: true })),
      recordSiteNoticeRead: vi.fn(),
      prismaMock,
      transaction,
    };
  });

vi.mock("next/cache", () => ({
  revalidatePath,
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("@/lib/db", () => ({ prisma: { ...prismaMock, $transaction: transaction } }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/site-notices", async () => {
  const actual = await vi.importActual<typeof import("@/lib/site-notices")>("@/lib/site-notices");
  return { ...actual, recordSiteNoticeRead };
});
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin, requireUser };
});

import {
  addSiteNotice,
  addSiteNoticeCategory,
  deleteSiteNotice,
  deleteSiteNoticeCategory,
  markSiteNoticeRead,
  markSiteNoticesRead,
  reorderSiteNoticeCategories,
  setSiteNoticeEnabled,
  updateSiteNotice,
  updateSiteNoticeCategory,
} from "./notices";

const ADMIN = { id: "admin-1" };
const USER = { id: "user-1" };

function bellForm(fields: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("title", "Path closed");
  formData.set("body", "The riverside path is closed this week.");
  formData.set("kind", "BELL");
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue(ADMIN);
  requireUser.mockResolvedValue(USER);
  checkRateLimit.mockReturnValue({ ok: true });
});

describe("addSiteNotice", () => {
  it("requires a title and a bell message", async () => {
    const noTitle = new FormData();
    noTitle.set("body", "x");
    expect(await addSiteNotice(null, noTitle)).toEqual({ ok: false, error: "Add a title." });
  });

  it("requires a category and page body for a full-page notice", async () => {
    const result = await addSiteNotice(null, bellForm({ kind: "PAGE" }));
    expect(result).toEqual({ ok: false, error: "Choose a category for a full-page notice." });
  });

  it("adds a bell notice", async () => {
    prismaMock.siteNotice.create.mockResolvedValueOnce({});
    const result = await addSiteNotice(null, bellForm());
    expect(result).toEqual({
      ok: true,
      message: "Notice added. Members will see it in the bell.",
    });
  });

  it("rejects a full-page notice pointing at a category that doesn't exist", async () => {
    prismaMock.siteNoticeCategory.findUnique.mockResolvedValueOnce(null);
    const result = await addSiteNotice(
      null,
      bellForm({ kind: "PAGE", categoryId: "cat-1", pageBody: "Full text here." }),
    );
    expect(result).toEqual({ ok: false, error: "That category is no longer there." });
  });
});

describe("updateSiteNotice", () => {
  it("requires a notice to be selected", async () => {
    const result = await updateSiteNotice(null, bellForm());
    expect(result).toEqual({ ok: false, error: "No notice selected." });
  });

  it("reports the notice as gone if it no longer exists", async () => {
    prismaMock.siteNotice.findUnique.mockResolvedValueOnce(null);
    const result = await updateSiteNotice(null, bellForm({ noticeId: "notice-1" }));
    expect(result).toEqual({ ok: false, error: "That notice is no longer there." });
  });

  it("keeps a pinned system notice bell-only regardless of what the form posted", async () => {
    prismaMock.siteNotice.findUnique
      .mockResolvedValueOnce({ systemKey: "welcome" }) // maxBody lookup
      .mockResolvedValueOnce({ id: "notice-1", slug: null, systemKey: "welcome" }); // inside tx
    prismaMock.siteNotice.update.mockResolvedValueOnce({});

    await updateSiteNotice(
      null,
      bellForm({
        noticeId: "notice-1",
        kind: "PAGE",
        categoryId: "cat-1",
        pageBody: "Full page text.",
      }),
    );

    expect(prismaMock.siteNotice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ kind: "BELL", pageBody: null, categoryId: null }),
      }),
    );
  });
});

describe("deleteSiteNotice", () => {
  it("refuses to remove a pinned system notice", async () => {
    prismaMock.siteNotice.findUnique.mockResolvedValueOnce({ systemKey: "welcome" });
    const formData = new FormData();
    formData.set("noticeId", "notice-1");
    const result = await deleteSiteNotice(null, formData);
    expect(result).toEqual({ ok: false, error: "That notice is pinned and cannot be removed." });
    expect(prismaMock.siteNotice.delete).not.toHaveBeenCalled();
  });

  it("removes a regular notice", async () => {
    prismaMock.siteNotice.findUnique.mockResolvedValueOnce({ systemKey: null });
    prismaMock.siteNotice.delete.mockResolvedValueOnce({});
    const formData = new FormData();
    formData.set("noticeId", "notice-1");
    const result = await deleteSiteNotice(null, formData);
    expect(result).toEqual({ ok: true, message: "Notice removed." });
  });
});

describe("setSiteNoticeEnabled", () => {
  it("refuses to toggle a non-pinned notice", async () => {
    prismaMock.siteNotice.findUnique.mockResolvedValueOnce({ id: "notice-1", systemKey: null });
    const formData = new FormData();
    formData.set("noticeId", "notice-1");
    formData.set("enabled", "on");
    const result = await setSiteNoticeEnabled(null, formData);
    expect(result).toEqual({
      ok: false,
      error: "Only the pinned welcome notice can be turned off.",
    });
  });

  it("toggles the pinned welcome notice", async () => {
    prismaMock.siteNotice.findUnique.mockResolvedValueOnce({
      id: "notice-1",
      systemKey: "welcome",
    });
    prismaMock.siteNotice.update.mockResolvedValueOnce({});
    const formData = new FormData();
    formData.set("noticeId", "notice-1");
    const result = await setSiteNoticeEnabled(null, formData);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.message).toContain("hidden");
  });
});

describe("markSiteNoticesRead", () => {
  it("rate-limits repeated calls", async () => {
    checkRateLimit.mockReturnValueOnce({ ok: false, retryAfterSeconds: 5 });
    const result = await markSiteNoticesRead();
    expect(result).toEqual({ ok: false, error: "Try again in a moment." });
  });

  it("does nothing when there's nothing in the bell", async () => {
    prismaMock.siteNotice.findMany.mockResolvedValueOnce([]);
    const result = await markSiteNoticesRead();
    expect(prismaMock.siteNoticeRead.createMany).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });
});

describe("markSiteNoticeRead", () => {
  it("requires a notice id", async () => {
    const result = await markSiteNoticeRead("");
    expect(result).toEqual({ ok: false, error: "No notice selected." });
  });

  it("reports the notice as gone if it no longer exists", async () => {
    prismaMock.siteNotice.findUnique.mockResolvedValueOnce(null);
    const result = await markSiteNoticeRead("notice-1");
    expect(result).toEqual({ ok: false, error: "That notice is no longer there." });
  });

  it("records the read", async () => {
    prismaMock.siteNotice.findUnique.mockResolvedValueOnce({ id: "notice-1" });
    recordSiteNoticeRead.mockResolvedValueOnce(undefined);
    const result = await markSiteNoticeRead("notice-1");
    expect(recordSiteNoticeRead).toHaveBeenCalledWith(USER.id, "notice-1");
    expect(result).toEqual({ ok: true });
  });
});

describe("addSiteNoticeCategory", () => {
  it("requires a category name", async () => {
    const result = await addSiteNoticeCategory(null, new FormData());
    expect(result).toEqual({ ok: false, error: "Add a category name." });
  });

  it("blocks adding once the category cap is reached", async () => {
    prismaMock.siteNoticeCategory.count.mockResolvedValueOnce(8);
    const formData = new FormData();
    formData.set("label", "New category");
    const result = await addSiteNoticeCategory(null, formData);
    expect(result).toEqual({ ok: false, error: "You can have up to 8 categories." });
  });
});

describe("updateSiteNoticeCategory", () => {
  it("requires a category to be selected", async () => {
    const formData = new FormData();
    formData.set("label", "General");
    const result = await updateSiteNoticeCategory(null, formData);
    expect(result).toEqual({ ok: false, error: "No category selected." });
  });
});

describe("deleteSiteNoticeCategory", () => {
  it("refuses to remove the last remaining category", async () => {
    prismaMock.siteNoticeCategory.findUnique.mockResolvedValueOnce({
      id: "cat-1",
      _count: { notices: 0 },
    });
    prismaMock.siteNoticeCategory.count.mockResolvedValueOnce(1);
    const formData = new FormData();
    formData.set("categoryId", "cat-1");
    const result = await deleteSiteNoticeCategory(null, formData);
    expect(result).toEqual({ ok: false, error: "Keep at least one category." });
  });

  it("refuses to remove a category that still has notices in it", async () => {
    prismaMock.siteNoticeCategory.findUnique.mockResolvedValueOnce({
      id: "cat-1",
      _count: { notices: 3 },
    });
    prismaMock.siteNoticeCategory.count.mockResolvedValueOnce(2);
    const formData = new FormData();
    formData.set("categoryId", "cat-1");
    const result = await deleteSiteNoticeCategory(null, formData);
    expect(result).toEqual({
      ok: false,
      error: "Move or remove the notices in this category first.",
    });
  });
});

describe("reorderSiteNoticeCategories", () => {
  it("rejects a malformed id list", async () => {
    const result = await reorderSiteNoticeCategories([]);
    expect(result).toEqual({ ok: false, error: "Could not save that order. Try again." });
  });

  it("rejects when the set of categories has changed since the list was loaded", async () => {
    prismaMock.siteNoticeCategory.findMany.mockResolvedValueOnce([{ id: "cat-1" }]);
    const result = await reorderSiteNoticeCategories(["cat-1", "cat-2"]);
    expect(result).toEqual({ ok: false, error: "Categories changed. Refresh and try again." });
  });

  it("applies the requested order", async () => {
    prismaMock.siteNoticeCategory.findMany.mockResolvedValueOnce([{ id: "cat-1" }, { id: "cat-2" }]);
    prismaMock.siteNoticeCategory.update.mockResolvedValue({});
    const result = await reorderSiteNoticeCategories(["cat-2", "cat-1"]);
    expect(prismaMock.siteNoticeCategory.update).toHaveBeenCalledWith({
      where: { id: "cat-2" },
      data: { sortOrder: 0 },
    });
    expect(result).toEqual({ ok: true });
  });
});
