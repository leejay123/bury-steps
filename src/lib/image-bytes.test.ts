import { describe, expect, it } from "vitest";
import { isAllowedImageMime, sniffImageMime } from "./image-bytes";

describe("sniffImageMime", () => {
  it("identifies a JPEG by its magic bytes", () => {
    expect(sniffImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toBe("image/jpeg");
  });

  it("identifies a PNG by its magic bytes", () => {
    expect(sniffImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toBe("image/png");
  });

  it("identifies a WebP by its RIFF/WEBP header", () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0, 0, 0, 0, // size (unused by the sniffer)
      0x57, 0x45, 0x42, 0x50, // "WEBP"
    ]);
    expect(sniffImageMime(bytes)).toBe("image/webp");
  });

  it("identifies a GIF by its magic bytes", () => {
    expect(sniffImageMime(new Uint8Array([0x47, 0x49, 0x46, 0, 0, 0]))).toBe("image/gif");
  });

  it("returns null for content that isn't a recognised image", () => {
    expect(sniffImageMime(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBeNull(); // "%PDF"
  });

  it("returns null rather than throwing on very short input", () => {
    expect(sniffImageMime(new Uint8Array([0x89]))).toBeNull();
  });

  it("does not trust a file extension or declared type — only the bytes matter", () => {
    // A renamed .txt file claiming to be a JPEG, but without the real magic bytes.
    const fakeJpeg = new TextEncoder().encode("just some text pretending to be an image");
    expect(sniffImageMime(fakeJpeg)).toBeNull();
  });
});

describe("isAllowedImageMime", () => {
  it("allows the supported image types", () => {
    expect(isAllowedImageMime("image/jpeg")).toBe(true);
    expect(isAllowedImageMime("image/png")).toBe(true);
    expect(isAllowedImageMime("image/webp")).toBe(true);
    expect(isAllowedImageMime("image/gif")).toBe(true);
  });

  it("rejects anything else, including scripts disguised with an image content-type", () => {
    expect(isAllowedImageMime("image/svg+xml")).toBe(false);
    expect(isAllowedImageMime("text/html")).toBe(false);
    expect(isAllowedImageMime("application/javascript")).toBe(false);
  });
});
