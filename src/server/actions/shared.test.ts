import { describe, expect, it, vi, beforeEach } from "vitest";

const { revalidatePath, revalidateTag, executeRawUnsafe, transaction, prismaMock } = vi.hoisted(
  () => {
    const executeRawUnsafe = vi.fn();
    const prismaMock: Record<string, unknown> = {};
    const transaction = vi.fn(async (arg: unknown) => {
      if (Array.isArray(arg)) return Promise.all(arg);
      // Interactive-transaction form: hand the callback a `tx` that
      // supports the raw-lock call plus whatever the test stashed on prisma.
      return (arg as (tx: unknown) => unknown)({
        $executeRawUnsafe: executeRawUnsafe,
        ...prismaMock,
      });
    });
    prismaMock.$transaction = transaction;
    return {
      revalidatePath: vi.fn(),
      revalidateTag: vi.fn(),
      executeRawUnsafe,
      transaction,
      prismaMock,
    };
  },
);
vi.mock("next/cache", () => ({ revalidatePath, revalidateTag }));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import {
  LimitReachedError,
  applySortOrder,
  isNotFoundStatus,
  isPrismaCode,
  logActionError,
  readOptionalImage,
  readSlideImage,
  revalidateHomepage,
  revalidateWalkShare,
  validateReorderIds,
  withCountLimitLock,
} from "./shared";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isPrismaCode", () => {
  it("matches a Prisma error carrying the given code", () => {
    expect(isPrismaCode({ code: "P2025" }, "P2025")).toBe(true);
  });

  it("rejects a different code, or a non-error value", () => {
    expect(isPrismaCode({ code: "P2002" }, "P2025")).toBe(false);
    expect(isPrismaCode(new Error("boom"), "P2025")).toBe(false);
    expect(isPrismaCode(null, "P2025")).toBe(false);
    expect(isPrismaCode("P2025", "P2025")).toBe(false);
  });
});

describe("isNotFoundStatus", () => {
  it("matches a Clerk-style 404 error", () => {
    expect(isNotFoundStatus({ status: 404 })).toBe(true);
  });

  it("rejects a different status, or a non-error value", () => {
    expect(isNotFoundStatus({ status: 500 })).toBe(false);
    expect(isNotFoundStatus(new Error("boom"))).toBe(false);
    expect(isNotFoundStatus(null)).toBe(false);
  });
});

describe("logActionError", () => {
  it("logs the real error and returns a generic message to the caller", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const secret = new Error("connection string leaked here");
    const result = logActionError("deleteWalk", secret);
    expect(result).toEqual({ ok: false, error: "Something went wrong. Try again." });
    expect(spy).toHaveBeenCalledWith("[actions:deleteWalk]", secret);
    spy.mockRestore();
  });

  it("uses a caller-supplied fallback message when given one", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = logActionError("deleteWalk", new Error("x"), "Could not delete the walk.");
    expect(result).toEqual({ ok: false, error: "Could not delete the walk." });
  });
});

describe("validateReorderIds", () => {
  it("accepts a well-formed array of ids", () => {
    expect(validateReorderIds(["a", "b", "c"], 5)).toEqual(["a", "b", "c"]);
  });

  it.each([
    ["not an array", "a string"],
    ["an empty array", []],
    ["more ids than maxLength allows", ["a", "b", "c"]],
    ["a non-string entry", ["a", 2]],
    ["an empty-string entry", ["a", ""]],
    ["an overlong entry", ["a", "x".repeat(101)]],
  ])("rejects %s", (_label, input) => {
    const result = validateReorderIds(input, 2);
    expect(result).toEqual({ error: "Could not save that order. Try again." });
  });
});

// applySortOrder passes each call straight to prisma.$transaction([...]), which
// is mocked above to Promise.all the array — a plain resolved promise stands
// in fine for the real Prisma.PrismaPromise return type here.
type SortOrderUpdate = Parameters<typeof applySortOrder>[2];

describe("applySortOrder", () => {
  it("applies the requested order for ids that still exist", async () => {
    const update = vi.fn((id: string, sortOrder: number) => Promise.resolve({ id, sortOrder }));
    await applySortOrder(["b", "a"], [{ id: "a" }, { id: "b" }], update as unknown as SortOrderUpdate);
    expect(update).toHaveBeenCalledWith("b", 0);
    expect(update).toHaveBeenCalledWith("a", 1);
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("drops ids that are no longer in the existing set, and appends any existing id the caller omitted", async () => {
    const update = vi.fn((id: string, sortOrder: number) => Promise.resolve({ id, sortOrder }));
    // "gone" was deleted concurrently; "c" exists but the caller's list is stale.
    await applySortOrder(
      ["gone", "b"],
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      update as unknown as SortOrderUpdate,
    );
    expect(update).toHaveBeenCalledWith("b", 0);
    expect(update).toHaveBeenCalledWith("a", 1);
    expect(update).toHaveBeenCalledWith("c", 2);
    expect(update).not.toHaveBeenCalledWith("gone", expect.anything());
  });

  it("does nothing when no requested id survives (avoids an empty transaction)", async () => {
    const update = vi.fn();
    await applySortOrder(["gone"], [], update as unknown as SortOrderUpdate);
    expect(update).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });
});

describe("withCountLimitLock", () => {
  it("takes the advisory lock before running the callback, inside one transaction", async () => {
    const fn = vi.fn(async () => "result");
    const result = await withCountLimitLock(1234, fn);
    expect(result).toBe("result");
    expect(executeRawUnsafe).toHaveBeenCalledWith("SELECT pg_advisory_xact_lock(1234)");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("propagates a LimitReachedError thrown by the callback instead of swallowing it", async () => {
    await expect(
      withCountLimitLock(1234, async () => {
        throw new LimitReachedError("You can have up to 3 slides.");
      }),
    ).rejects.toBeInstanceOf(LimitReachedError);
  });
});

describe("revalidateWalkShare", () => {
  it("revalidates the token path, and the slug path when the walk has one", () => {
    revalidateWalkShare({ token: "tok123", slug: "sunday-stroll" });
    expect(revalidatePath).toHaveBeenCalledWith("/w/tok123");
    expect(revalidatePath).toHaveBeenCalledWith("/w/sunday-stroll");
  });

  it("skips the slug path when the walk has none", () => {
    revalidateWalkShare({ token: "tok123", slug: null });
    expect(revalidatePath).toHaveBeenCalledWith("/w/tok123");
    expect(revalidatePath).not.toHaveBeenCalledWith(expect.stringMatching(/^\/w\/(?!tok123)/));
  });
});

describe("revalidateHomepage", () => {
  it("revalidates the homepage cache tag and every admin homepage-editing route", () => {
    revalidateHomepage();
    expect(revalidateTag).toHaveBeenCalledWith("homepage", { expire: 0 });
    for (const path of [
      "/",
      "/admin/homepage",
      "/admin/settings",
      "/admin/settings/hero-photos",
      "/admin/settings/testimonials",
      "/admin/settings/faqs",
    ]) {
      expect(revalidatePath).toHaveBeenCalledWith(path);
    }
  });
});

/** A minimal (1x1) but structurally valid PNG, so `sniffImageMime` recognizes it. */
function pngBytes(byteLength = 100): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(byteLength));
  bytes.set([0x89, 0x50, 0x4e, 0x47], 0);
  return bytes;
}

function formDataWithImage(file: File | null): FormData {
  const formData = new FormData();
  if (file) formData.set("image", file);
  return formData;
}

describe("readSlideImage", () => {
  it("rejects when no file was chosen", async () => {
    const result = await readSlideImage(formDataWithImage(null));
    expect(result).toEqual({ error: "Choose an image to upload." });
  });

  it("rejects an empty file", async () => {
    const file = new File([], "photo.png", { type: "image/png" });
    const result = await readSlideImage(formDataWithImage(file));
    expect(result).toEqual({ error: "Choose an image to upload." });
  });

  it("rejects a file over the 4 MB cap", async () => {
    const oversized = new File([pngBytes(4 * 1024 * 1024 + 1)], "photo.png", { type: "image/png" });
    const result = await readSlideImage(formDataWithImage(oversized));
    expect(result).toEqual({ error: "Keep the image under 4 MB." });
  });

  it("rejects a file whose bytes don't sniff as an allowed image type", async () => {
    // A file claiming to be a PNG by extension/MIME, but whose bytes don't
    // match the PNG signature — the check is on the actual bytes, not on
    // what the browser says the file is.
    const notReallyAnImage = new File([new Uint8Array([1, 2, 3, 4])], "photo.png", {
      type: "image/png",
    });
    const result = await readSlideImage(formDataWithImage(notReallyAnImage));
    expect(result).toEqual({ error: "Use a JPEG, PNG or WebP image." });
  });

  it("accepts a valid image and returns its (metadata-stripped) bytes and sniffed mime", async () => {
    const file = new File([pngBytes()], "photo.png", { type: "image/png" });
    const result = await readSlideImage(formDataWithImage(file));
    expect("error" in result).toBe(false);
    if ("error" in result) throw new Error("unreachable");
    expect(result.mime).toBe("image/png");
    expect(result.data).toBeInstanceOf(Uint8Array);
  });
});

describe("readOptionalImage", () => {
  it("returns null (not an error) when the caller didn't choose a new image", async () => {
    expect(await readOptionalImage(formDataWithImage(null))).toBeNull();
    const empty = new File([], "photo.png", { type: "image/png" });
    expect(await readOptionalImage(formDataWithImage(empty))).toBeNull();
  });

  it("validates the image the same way readSlideImage does when one was chosen", async () => {
    const bad = new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" });
    const result = await readOptionalImage(formDataWithImage(bad));
    expect(result).toEqual({ error: "Use a JPEG, PNG or WebP image." });
  });
});
