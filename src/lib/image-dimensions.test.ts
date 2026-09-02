import { describe, expect, it } from "vitest";
import { readImageDimensions } from "./image-dimensions";

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const part of parts) {
    out.set(part, pos);
    pos += part.length;
  }
  return out;
}

function asciiBytes(text: string): number[] {
  return [...text].map((char) => char.charCodeAt(0));
}

function u32be(n: number): number[] {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function u16be(n: number): number[] {
  return [(n >>> 8) & 0xff, n & 0xff];
}

function u24le(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff];
}

describe("readImageDimensions — PNG", () => {
  function pngWithSize(width: number, height: number): Uint8Array {
    const signature = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    const ihdr = concat(
      bytes(0, 0, 0, 13), // chunk length
      bytes(...asciiBytes("IHDR")),
      bytes(...u32be(width)),
      bytes(...u32be(height)),
      bytes(8, 6, 0, 0, 0), // bit depth, color type, compression, filter, interlace
    );
    return concat(signature, ihdr);
  }

  it("reads width and height from the IHDR chunk", () => {
    expect(readImageDimensions(pngWithSize(512, 512), "image/png")).toEqual({
      width: 512,
      height: 512,
    });
    expect(readImageDimensions(pngWithSize(1200, 630), "image/png")).toEqual({
      width: 1200,
      height: 630,
    });
  });

  it("returns null when the first chunk isn't IHDR", () => {
    const signature = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    const notIhdr = concat(bytes(0, 0, 0, 13), bytes(...asciiBytes("IDAT")), new Uint8Array(13));
    expect(readImageDimensions(concat(signature, notIhdr), "image/png")).toBeNull();
  });
});

describe("readImageDimensions — JPEG", () => {
  function jpegWithSize(width: number, height: number): Uint8Array {
    const soi = bytes(0xff, 0xd8);
    // SOF0: marker, length(2), precision(1), height(2), width(2), ...
    const sof0Payload = [8, ...u16be(height), ...u16be(width), 1, 0, 0x11, 0];
    const length = sof0Payload.length + 2;
    const sof0 = bytes(0xff, 0xc0, (length >> 8) & 0xff, length & 0xff, ...sof0Payload);
    return concat(soi, sof0);
  }

  it("reads width and height from the SOF0 segment", () => {
    expect(readImageDimensions(jpegWithSize(800, 600), "image/jpeg")).toEqual({
      width: 800,
      height: 600,
    });
    expect(readImageDimensions(jpegWithSize(64, 64), "image/jpeg")).toEqual({
      width: 64,
      height: 64,
    });
  });

  it("returns null when scan data starts before any SOF marker is found", () => {
    const soi = bytes(0xff, 0xd8);
    const sos = bytes(0xff, 0xda, 0, 4, 0, 0);
    expect(readImageDimensions(concat(soi, sos), "image/jpeg")).toBeNull();
  });
});

describe("readImageDimensions — WebP", () => {
  function riffHeader(chunkFourCc: string, chunkData: Uint8Array): Uint8Array {
    const chunk = concat(bytes(...asciiBytes(chunkFourCc)), bytes(...u32be(chunkData.length)), chunkData);
    const riffSize = 4 + chunk.length; // "WEBP" + chunk
    return concat(
      bytes(...asciiBytes("RIFF")),
      bytes(...u32be(riffSize).reverse()), // RIFF size field is little-endian
      bytes(...asciiBytes("WEBP")),
      chunk,
    );
  }

  it("reads width and height from a VP8X (extended) chunk", () => {
    const data = concat(
      bytes(0x10, 0, 0, 0), // flags + reserved
      bytes(...u24le(511)), // width - 1
      bytes(...u24le(511)), // height - 1
    );
    const webp = riffHeader("VP8X", data);
    expect(readImageDimensions(webp, "image/webp")).toEqual({ width: 512, height: 512 });
  });

  it("reads width and height from a lossy VP8 chunk", () => {
    const width = 320;
    const height = 240;
    const data = concat(
      bytes(0, 0, 0), // frame tag
      bytes(0x9d, 0x01, 0x2a), // start code
      bytes(width & 0xff, (width >> 8) & 0xff), // little-endian, top 2 bits are scale (0 here)
      bytes(height & 0xff, (height >> 8) & 0xff),
    );
    const webp = riffHeader("VP8 ", data);
    expect(readImageDimensions(webp, "image/webp")).toEqual({ width, height });
  });

  it("reads width and height from a lossless VP8L chunk", () => {
    const width = 128;
    const height = 128;
    const bits = ((width - 1) & 0x3fff) | (((height - 1) & 0x3fff) << 14);
    const data = concat(
      bytes(0x2f),
      bytes(bits & 0xff, (bits >>> 8) & 0xff, (bits >>> 16) & 0xff, (bits >>> 24) & 0xff),
    );
    const webp = riffHeader("VP8L", data);
    expect(readImageDimensions(webp, "image/webp")).toEqual({ width, height });
  });
});

describe("readImageDimensions — unrecognised input", () => {
  it("returns null for an unsupported mime type", () => {
    expect(readImageDimensions(new Uint8Array(100), "image/gif")).toBeNull();
  });

  it("returns null for bytes too short to contain a header", () => {
    expect(readImageDimensions(new Uint8Array(4), "image/png")).toBeNull();
  });
});
