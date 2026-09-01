import { describe, expect, it, vi, beforeEach } from "vitest";

const { requireAdmin, prismaMock, transaction } = vi.hoisted(() => {
  const prismaMock: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    homepageTestimonial: {
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
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
  addHomepageTestimonial,
  deleteHomepageTestimonial,
  reorderHomepageTestimonials,
  updateHomepageTestimonial,
} from "./homepage-testimonials";

const ADMIN = { id: "admin-1" };

function baseForm(fields: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("name", "Jo");
  formData.set("quote", "Loved it!");
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue(ADMIN);
});

describe("addHomepageTestimonial", () => {
  it("requires a name and a quote", async () => {
    const missingName = new FormData();
    missingName.set("quote", "Loved it!");
    expect(await addHomepageTestimonial(null, missingName)).toEqual({
      ok: false,
      error: "Add a name.",
    });

    const missingQuote = new FormData();
    missingQuote.set("name", "Jo");
    expect(await addHomepageTestimonial(null, missingQuote)).toEqual({
      ok: false,
      error: "Add the testimonial text.",
    });
  });

  it("blocks adding once the testimonial cap is reached", async () => {
    prismaMock.homepageTestimonial.count.mockResolvedValueOnce(12);
    const result = await addHomepageTestimonial(null, baseForm());
    expect(result).toEqual({ ok: false, error: "You can have up to 12 testimonials." });
  });

  it("adds a testimonial without requiring a photo", async () => {
    prismaMock.homepageTestimonial.count.mockResolvedValueOnce(0);
    prismaMock.homepageTestimonial.create.mockResolvedValueOnce({});

    const result = await addHomepageTestimonial(null, baseForm({ role: "Member" }));

    expect(prismaMock.homepageTestimonial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Jo", role: "Member", quote: "Loved it!" }),
      }),
    );
    expect(result).toEqual({ ok: true, message: "Testimonial added." });
  });
});

describe("updateHomepageTestimonial", () => {
  it("requires a testimonial to be selected", async () => {
    const result = await updateHomepageTestimonial(null, baseForm());
    expect(result).toEqual({ ok: false, error: "No testimonial selected." });
  });

  it("clears the photo when removeImage is set and no new image was chosen", async () => {
    const formData = baseForm({ testimonialId: "t-1", removeImage: "on" });
    prismaMock.homepageTestimonial.update.mockResolvedValueOnce({});

    await updateHomepageTestimonial(null, formData);

    expect(prismaMock.homepageTestimonial.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ imagePath: null, imageMime: null, imageData: null }),
      }),
    );
  });

  it("reports the testimonial as gone (P2025) rather than a generic failure", async () => {
    const formData = baseForm({ testimonialId: "t-1" });
    prismaMock.homepageTestimonial.update.mockRejectedValueOnce({ code: "P2025" });
    const result = await updateHomepageTestimonial(null, formData);
    expect(result).toEqual({ ok: false, error: "That testimonial is no longer there." });
  });
});

describe("deleteHomepageTestimonial", () => {
  it("requires a testimonial to be selected", async () => {
    const result = await deleteHomepageTestimonial(null, new FormData());
    expect(result).toEqual({ ok: false, error: "No testimonial selected." });
  });

  it("re-numbers the remaining testimonials' sort order after deleting one", async () => {
    const formData = new FormData();
    formData.set("testimonialId", "t-2");
    prismaMock.homepageTestimonial.delete.mockResolvedValueOnce({});
    prismaMock.homepageTestimonial.findMany.mockResolvedValueOnce([{ id: "t-1" }, { id: "t-3" }]);

    const result = await deleteHomepageTestimonial(null, formData);

    expect(prismaMock.homepageTestimonial.update).toHaveBeenCalledWith({
      where: { id: "t-1" },
      data: { sortOrder: 0 },
    });
    expect(result).toEqual({ ok: true, message: "Testimonial removed." });
  });
});

describe("reorderHomepageTestimonials", () => {
  it("rejects a malformed id list", async () => {
    const result = await reorderHomepageTestimonials([]);
    expect(result).toEqual({ ok: false, error: "Could not save that order. Try again." });
  });

  it("applies the requested order", async () => {
    prismaMock.homepageTestimonial.findMany.mockResolvedValueOnce([{ id: "a" }, { id: "b" }]);
    const result = await reorderHomepageTestimonials(["b", "a"]);
    expect(prismaMock.homepageTestimonial.update).toHaveBeenCalledWith({
      where: { id: "b" },
      data: { sortOrder: 0 },
    });
    expect(result).toEqual({ ok: true });
  });
});
