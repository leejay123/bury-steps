import { describe, expect, it, vi, beforeEach } from "vitest";

const { requireAdmin, prismaMock, transaction } = vi.hoisted(() => {
  const prismaMock: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    homepageFaq: { count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
    homepageFaqCategory: {
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  };
  const transaction = vi.fn(async (arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    return (arg as (tx: unknown) => unknown)({ $executeRawUnsafe: vi.fn(), ...prismaMock });
  });
  return { requireAdmin: vi.fn(), prismaMock, transaction };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("@/lib/db", () => ({ prisma: { ...prismaMock, $transaction: transaction } }));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin };
});

import {
  addHomepageFaq,
  addHomepageFaqCategory,
  deleteHomepageFaq,
  deleteHomepageFaqCategory,
  reorderHomepageFaqCategories,
  reorderHomepageFaqs,
  updateHomepageFaq,
  updateHomepageFaqCategory,
} from "./homepage-faqs";

const ADMIN = { id: "admin-1" };

function faqForm(fields: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("categoryId", "cat-1");
  formData.set("question", "How do I join?");
  formData.set("answer", "Sign up on the site.");
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue(ADMIN);
  prismaMock.homepageFaqCategory.findUnique.mockResolvedValue({ id: "cat-1" });
});

describe("addHomepageFaq", () => {
  it("requires a valid category", async () => {
    prismaMock.homepageFaqCategory.findUnique.mockResolvedValueOnce(null);
    const result = await addHomepageFaq(null, faqForm());
    expect(result).toEqual({ ok: false, error: "Choose a category." });
  });

  it("blocks adding once the FAQ cap is reached", async () => {
    prismaMock.homepageFaq.count.mockResolvedValueOnce(20);
    const result = await addHomepageFaq(null, faqForm());
    expect(result).toEqual({ ok: false, error: "You can have up to 20 FAQs." });
  });

  it("adds the FAQ", async () => {
    prismaMock.homepageFaq.count.mockResolvedValueOnce(0);
    prismaMock.homepageFaq.create.mockResolvedValueOnce({});
    const result = await addHomepageFaq(null, faqForm());
    expect(result).toEqual({ ok: true, message: "FAQ added." });
  });
});

describe("updateHomepageFaq", () => {
  it("requires an FAQ to be selected", async () => {
    const result = await updateHomepageFaq(null, faqForm());
    expect(result).toEqual({ ok: false, error: "No FAQ selected." });
  });

  it("reports the FAQ as gone (P2025) rather than a generic failure", async () => {
    const formData = faqForm({ faqId: "faq-1" });
    prismaMock.homepageFaq.update.mockRejectedValueOnce({ code: "P2025" });
    const result = await updateHomepageFaq(null, formData);
    expect(result).toEqual({ ok: false, error: "That FAQ is no longer there." });
  });
});

describe("deleteHomepageFaq", () => {
  it("re-numbers the remaining FAQs' sort order after deleting one", async () => {
    const formData = new FormData();
    formData.set("faqId", "faq-2");
    prismaMock.homepageFaq.delete.mockResolvedValueOnce({});
    prismaMock.homepageFaq.findMany.mockResolvedValueOnce([{ id: "faq-1" }, { id: "faq-3" }]);

    const result = await deleteHomepageFaq(null, formData);

    expect(prismaMock.homepageFaq.update).toHaveBeenCalledWith({
      where: { id: "faq-1" },
      data: { sortOrder: 0 },
    });
    expect(result).toEqual({ ok: true, message: "FAQ removed." });
  });
});

describe("reorderHomepageFaqs", () => {
  it("applies the requested order", async () => {
    prismaMock.homepageFaq.findMany.mockResolvedValueOnce([{ id: "a" }, { id: "b" }]);
    const result = await reorderHomepageFaqs(["b", "a"]);
    expect(result).toEqual({ ok: true });
  });
});

describe("addHomepageFaqCategory", () => {
  it("requires a category name", async () => {
    const result = await addHomepageFaqCategory(null, new FormData());
    expect(result).toEqual({ ok: false, error: "Add a category name." });
  });

  it("blocks adding once the category cap is reached", async () => {
    prismaMock.homepageFaqCategory.count.mockResolvedValueOnce(8);
    const formData = new FormData();
    formData.set("label", "New category");
    const result = await addHomepageFaqCategory(null, formData);
    expect(result).toEqual({ ok: false, error: "You can have up to 8 categories." });
  });

  it("reports a friendly message for a same-instant duplicate name race (P2002)", async () => {
    prismaMock.homepageFaqCategory.count.mockResolvedValueOnce(0);
    prismaMock.homepageFaqCategory.findFirst.mockResolvedValueOnce(null);
    prismaMock.homepageFaqCategory.create.mockRejectedValueOnce({ code: "P2002" });
    const formData = new FormData();
    formData.set("label", "General");
    const result = await addHomepageFaqCategory(null, formData);
    expect(result).toEqual({
      ok: false,
      error: "A category with that name was just added. Try a different name.",
    });
  });
});

describe("updateHomepageFaqCategory", () => {
  it("requires a category to be selected", async () => {
    const formData = new FormData();
    formData.set("label", "General");
    const result = await updateHomepageFaqCategory(null, formData);
    expect(result).toEqual({ ok: false, error: "No category selected." });
  });
});

describe("deleteHomepageFaqCategory", () => {
  it("reports the category as gone if it no longer exists", async () => {
    prismaMock.homepageFaqCategory.findUnique.mockResolvedValueOnce(null);
    const formData = new FormData();
    formData.set("categoryId", "cat-1");
    const result = await deleteHomepageFaqCategory(null, formData);
    expect(result).toEqual({ ok: false, error: "That category is no longer there." });
  });

  it("refuses to remove the last remaining category", async () => {
    prismaMock.homepageFaqCategory.findUnique.mockResolvedValueOnce({
      id: "cat-1",
      _count: { faqs: 0 },
    });
    prismaMock.homepageFaqCategory.count.mockResolvedValueOnce(1);
    const formData = new FormData();
    formData.set("categoryId", "cat-1");
    const result = await deleteHomepageFaqCategory(null, formData);
    expect(result).toEqual({ ok: false, error: "Keep at least one category." });
  });

  it("refuses to remove a category that still has FAQs in it", async () => {
    prismaMock.homepageFaqCategory.findUnique.mockResolvedValueOnce({
      id: "cat-1",
      _count: { faqs: 2 },
    });
    prismaMock.homepageFaqCategory.count.mockResolvedValueOnce(3);
    const formData = new FormData();
    formData.set("categoryId", "cat-1");
    const result = await deleteHomepageFaqCategory(null, formData);
    expect(result).toEqual({ ok: false, error: "Move or remove the FAQs in this category first." });
  });

  it("removes an empty category when other categories remain", async () => {
    prismaMock.homepageFaqCategory.findUnique.mockResolvedValueOnce({
      id: "cat-1",
      _count: { faqs: 0 },
    });
    prismaMock.homepageFaqCategory.count.mockResolvedValueOnce(2);
    prismaMock.homepageFaqCategory.delete.mockResolvedValueOnce({});
    prismaMock.homepageFaqCategory.findMany.mockResolvedValueOnce([{ id: "cat-2" }]);

    const formData = new FormData();
    formData.set("categoryId", "cat-1");
    const result = await deleteHomepageFaqCategory(null, formData);
    expect(result).toEqual({ ok: true, message: "Category removed." });
  });
});

describe("reorderHomepageFaqCategories", () => {
  it("applies the requested order", async () => {
    prismaMock.homepageFaqCategory.findMany.mockResolvedValueOnce([{ id: "a" }, { id: "b" }]);
    const result = await reorderHomepageFaqCategories(["b", "a"]);
    expect(result).toEqual({ ok: true });
  });
});
