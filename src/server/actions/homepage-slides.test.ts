import { describe, expect, it, vi, beforeEach } from "vitest";

const { requireAdmin, prismaMock, transaction } = vi.hoisted(() => {
  const prismaMock: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    homepageSlide: {
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

import { addHomepageSlide, deleteHomepageSlide, replaceHomepageSlideImage, reorderHomepageSlides } from "./homepage-slides";

const ADMIN = { id: "admin-1" };

function pngBytes(byteLength = 100): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(byteLength));
  bytes.set([0x89, 0x50, 0x4e, 0x47], 0);
  return bytes;
}

function formWithImage(): FormData {
  const formData = new FormData();
  formData.set("image", new File([pngBytes()], "photo.png", { type: "image/png" }));
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue(ADMIN);
});

describe("addHomepageSlide", () => {
  it("rejects when no image was chosen", async () => {
    const result = await addHomepageSlide(null, new FormData());
    expect(result).toEqual({ ok: false, error: "Choose an image to upload." });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("blocks adding once the slide cap is reached", async () => {
    prismaMock.homepageSlide.count.mockResolvedValueOnce(3);
    const result = await addHomepageSlide(null, formWithImage());
    expect(result).toEqual({ ok: false, error: "You can have up to 3 slides." });
    expect(prismaMock.homepageSlide.create).not.toHaveBeenCalled();
  });

  it("adds a slide with the next sort order", async () => {
    prismaMock.homepageSlide.count.mockResolvedValueOnce(1);
    prismaMock.homepageSlide.create.mockResolvedValueOnce({});

    const result = await addHomepageSlide(null, formWithImage());

    expect(prismaMock.homepageSlide.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sortOrder: 1 }) }),
    );
    expect(result).toEqual({ ok: true, message: "Slide added." });
  });
});

describe("replaceHomepageSlideImage", () => {
  it("requires a slide to be selected", async () => {
    const result = await replaceHomepageSlideImage(null, formWithImage());
    expect(result).toEqual({ ok: false, error: "No slide selected." });
  });

  it("saves the caption alone when no new image was chosen", async () => {
    const formData = new FormData();
    formData.set("slideId", "slide-1");
    formData.set("alt", "New caption");
    prismaMock.homepageSlide.update.mockResolvedValueOnce({});

    const result = await replaceHomepageSlideImage(null, formData);

    expect(prismaMock.homepageSlide.update).toHaveBeenCalledWith({
      where: { id: "slide-1" },
      data: { alt: "New caption" },
    });
    expect(result.ok).toBe(true);
  });

  it("reports the slide as gone (P2025) rather than a generic failure", async () => {
    const formData = formWithImage();
    formData.set("slideId", "slide-1");
    prismaMock.homepageSlide.update.mockRejectedValueOnce({ code: "P2025" });

    const result = await replaceHomepageSlideImage(null, formData);
    expect(result).toEqual({ ok: false, error: "That slide is no longer there." });
  });
});

describe("deleteHomepageSlide", () => {
  it("requires a slide to be selected", async () => {
    const result = await deleteHomepageSlide(null, new FormData());
    expect(result).toEqual({ ok: false, error: "No slide selected." });
  });

  it("re-numbers the remaining slides' sort order after deleting one", async () => {
    const formData = new FormData();
    formData.set("slideId", "slide-2");
    prismaMock.homepageSlide.delete.mockResolvedValueOnce({});
    prismaMock.homepageSlide.findMany.mockResolvedValueOnce([{ id: "slide-1" }, { id: "slide-3" }]);

    const result = await deleteHomepageSlide(null, formData);

    expect(prismaMock.homepageSlide.update).toHaveBeenCalledWith({
      where: { id: "slide-1" },
      data: { sortOrder: 0 },
    });
    expect(prismaMock.homepageSlide.update).toHaveBeenCalledWith({
      where: { id: "slide-3" },
      data: { sortOrder: 1 },
    });
    expect(result).toEqual({ ok: true, message: "Slide removed." });
  });

  it("still reports success even if the delete itself found nothing (already gone)", async () => {
    const formData = new FormData();
    formData.set("slideId", "slide-1");
    prismaMock.homepageSlide.delete.mockRejectedValueOnce({ code: "P2025" });
    const result = await deleteHomepageSlide(null, formData);
    expect(result).toEqual({ ok: false, error: "That slide is no longer there." });
  });
});

describe("reorderHomepageSlides", () => {
  it("rejects a malformed id list", async () => {
    const result = await reorderHomepageSlides([]);
    expect(result).toEqual({ ok: false, error: "Could not save that order. Try again." });
    expect(prismaMock.homepageSlide.findMany).not.toHaveBeenCalled();
  });

  it("applies the requested order", async () => {
    prismaMock.homepageSlide.findMany.mockResolvedValueOnce([{ id: "a" }, { id: "b" }]);
    const result = await reorderHomepageSlides(["b", "a"]);
    expect(prismaMock.homepageSlide.update).toHaveBeenCalledWith({
      where: { id: "b" },
      data: { sortOrder: 0 },
    });
    expect(result).toEqual({ ok: true });
  });
});
