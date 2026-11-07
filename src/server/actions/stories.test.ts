import { describe, expect, it, vi, beforeEach } from "vitest";

const { requireUser, prismaMock, uploadStoryPhoto } = vi.hoisted(() => ({
  requireUser: vi.fn(),
  prismaMock: {
    story: { count: vi.fn(async () => 0), create: vi.fn(async () => ({})) },
  },
  uploadStoryPhoto: vi.fn(async () => {}),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/stories-settings", () => ({ getStoriesEnabled: vi.fn(async () => true) }));
vi.mock("@/lib/stories", async () => {
  const actual = await vi.importActual<typeof import("@/lib/stories")>("@/lib/stories");
  return { ...actual, purgeExpiredStories: vi.fn(async () => {}) };
});
vi.mock("@/lib/story-storage", () => ({
  storiesConfigured: () => true,
  uploadStoryPhoto,
  removeStoryPhotos: vi.fn(async () => {}),
}));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireUser };
});

import { postStory } from "./stories";

/** A tiny JPEG with an EXIF block (where a phone keeps GPS) after the start marker. */
function jpegWithExif(): Uint8Array {
  const exif = [0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
  const quant = [0xff, 0xdb, 0x00, 0x04, 0x00, 0x00];
  const scan = [0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9];
  return new Uint8Array([0xff, 0xd8, ...exif, ...quant, ...scan]);
}

function form(bytes: Uint8Array, claimedType: string): FormData {
  const formData = new FormData();
  formData.set("photo", new File([bytes as Uint8Array<ArrayBuffer>], "photo", { type: claimedType }));
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue({ id: "member-1", role: "MEMBER" });
});

describe("postStory", () => {
  it("rejects a file that only claims to be a photo", async () => {
    const notAPhoto = new TextEncoder().encode("MZ this is not an image");
    const result = await postStory(null, form(notAPhoto, "image/jpeg"));
    expect(result).toEqual({ ok: false, error: "That isn't a photo we can use. Try a JPEG or PNG." });
    expect(uploadStoryPhoto).not.toHaveBeenCalled();
  });

  it("goes by the file's contents, not the type the browser sent", async () => {
    const result = await postStory(null, form(jpegWithExif(), "application/octet-stream"));
    expect(result.ok).toBe(true);
    expect(uploadStoryPhoto).toHaveBeenCalledWith(expect.stringMatching(/^member-1\/.+\.jpg$/), expect.any(Blob), "image/jpeg");
  });

  it("strips hidden details such as location before storing", async () => {
    await postStory(null, form(jpegWithExif(), "image/jpeg"));
    const stored = new Uint8Array(await (uploadStoryPhoto.mock.calls[0] as unknown as [string, Blob])[1].arrayBuffer());
    expect(stored.length).toBeLessThan(jpegWithExif().length);
    expect([...stored].some((byte, i) => byte === 0xff && stored[i + 1] === 0xe1)).toBe(false);
  });

  it("rejects a photo over the size limit", async () => {
    const big = new Uint8Array(1_500_001);
    big.set([0xff, 0xd8, 0xff]);
    const result = await postStory(null, form(big, "image/jpeg"));
    expect(result).toEqual({ ok: false, error: "That photo is too big. Try another one." });
    expect(uploadStoryPhoto).not.toHaveBeenCalled();
  });
});
