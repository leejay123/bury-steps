import { describe, expect, it } from "vitest";
import { stripImageMetadata } from "./strip-image-metadata";

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

function jpegMarker(code: number, payload: number[]): Uint8Array {
  const length = payload.length + 2;
  return bytes(0xff, code, (length >> 8) & 0xff, length & 0xff, ...payload);
}

describe("stripImageMetadata — JPEG", () => {
  const soi = bytes(0xff, 0xd8);
  const app0Jfif = jpegMarker(0xe0, [...asciiBytes("JFIF"), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
  const app1Exif = jpegMarker(0xe1, [...asciiBytes("Exif"), 0, 0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const comment = jpegMarker(0xfe, asciiBytes("secret gps note"));
  const sosAndScan = bytes(0xff, 0xda, 0, 4, 0, 0, 0xaa, 0xbb, 0xcc);
  const eoi = bytes(0xff, 0xd9);

  it("removes the APP1 (EXIF) segment but keeps APP0 (JFIF)", () => {
    const input = concat(soi, app0Jfif, app1Exif, sosAndScan, eoi);
    const output = stripImageMetadata(input, "image/jpeg");

    expect(output).toEqual(concat(soi, app0Jfif, sosAndScan, eoi));
  });

  it("removes a COM (comment) segment too", () => {
    const input = concat(soi, app0Jfif, comment, sosAndScan, eoi);
    const output = stripImageMetadata(input, "image/jpeg");

    expect(output).toEqual(concat(soi, app0Jfif, sosAndScan, eoi));
  });

  it("leaves a JPEG with no metadata segments unchanged", () => {
    const input = concat(soi, app0Jfif, sosAndScan, eoi);
    const output = stripImageMetadata(input, "image/jpeg");

    expect(output).toEqual(input);
  });

  it("returns the original bytes unchanged if the file doesn't start with SOI", () => {
    const input = bytes(0x00, 0x01, 0x02, 0x03);
    expect(stripImageMetadata(input, "image/jpeg")).toEqual(input);
  });

  it("does not throw on a truncated/malformed file", () => {
    const input = concat(soi, bytes(0xff, 0xe1, 0xff)); // length byte cut off
    expect(() => stripImageMetadata(input, "image/jpeg")).not.toThrow();
  });
});

function pngChunk(type: string, data: number[]): Uint8Array {
  const length = data.length;
  const lengthBytes = [(length >>> 24) & 0xff, (length >>> 16) & 0xff, (length >>> 8) & 0xff, length & 0xff];
  const fakeCrc = [0, 0, 0, 0];
  return bytes(...lengthBytes, ...asciiBytes(type), ...data, ...fakeCrc);
}

describe("stripImageMetadata — PNG", () => {
  const signature = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  const ihdr = pngChunk("IHDR", new Array(13).fill(0));
  const idat = pngChunk("IDAT", [1, 2, 3, 4]);
  const iend = pngChunk("IEND", []);

  it("removes eXIf and tEXt chunks but keeps IHDR/IDAT/IEND", () => {
    const exifChunk = pngChunk("eXIf", [1, 2, 3, 4, 5]);
    const textChunk = pngChunk("tEXt", asciiBytes("GPS:51.5,-2.3"));
    const input = concat(signature, ihdr, exifChunk, textChunk, idat, iend);

    const output = stripImageMetadata(input, "image/png");

    expect(output).toEqual(concat(signature, ihdr, idat, iend));
  });

  it("leaves a PNG with no metadata chunks unchanged", () => {
    const input = concat(signature, ihdr, idat, iend);
    expect(stripImageMetadata(input, "image/png")).toEqual(input);
  });

  it("returns the original bytes unchanged if the signature doesn't match", () => {
    const input = bytes(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    expect(stripImageMetadata(input, "image/png")).toEqual(input);
  });
});

function webpChunk(fourCc: string, data: number[]): Uint8Array {
  const size = data.length;
  const sizeBytes = [size & 0xff, (size >>> 8) & 0xff, (size >>> 16) & 0xff, (size >>> 24) & 0xff];
  const padding = size % 2 === 1 ? [0] : [];
  return bytes(...asciiBytes(fourCc), ...sizeBytes, ...data, ...padding);
}

describe("stripImageMetadata — WebP", () => {
  const vp8Chunk = webpChunk("VP8 ", [10, 20, 30, 40]);

  function riffContainer(...chunks: Uint8Array[]): Uint8Array {
    const body = concat(...chunks);
    const riffSize = 4 + body.length; // "WEBP" + chunks
    const header = bytes(
      ...asciiBytes("RIFF"),
      riffSize & 0xff,
      (riffSize >>> 8) & 0xff,
      (riffSize >>> 16) & 0xff,
      (riffSize >>> 24) & 0xff,
      ...asciiBytes("WEBP"),
    );
    return concat(header, body);
  }

  it("removes the EXIF chunk and fixes up the RIFF size", () => {
    const exifChunk = webpChunk("EXIF", [1, 2, 3, 4, 5]); // odd length, exercises padding
    const input = riffContainer(vp8Chunk, exifChunk);

    const output = stripImageMetadata(input, "image/webp");

    expect(output).toEqual(riffContainer(vp8Chunk));
  });

  it("leaves a WebP with no metadata chunks unchanged", () => {
    const input = riffContainer(vp8Chunk);
    expect(stripImageMetadata(input, "image/webp")).toEqual(input);
  });

  it("returns the original bytes unchanged for a non-WebP RIFF file", () => {
    const input = bytes(...asciiBytes("RIFF"), 0, 0, 0, 0, ...asciiBytes("WAVE"));
    expect(stripImageMetadata(input, "image/webp")).toEqual(input);
  });
});

describe("stripImageMetadata — unsupported types", () => {
  it("passes GIF bytes through unchanged", () => {
    const input = bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 2, 3);
    expect(stripImageMetadata(input, "image/gif")).toEqual(input);
  });
});
