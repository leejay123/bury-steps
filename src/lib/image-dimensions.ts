/**
 * Read the pixel width/height out of an uploaded image's raw bytes, without
 * pulling in an image-processing library — used to enforce that a favicon
 * upload is actually square before it's stored. Supports the three formats
 * accepted for uploads (see `image-bytes.ts`); returns null if the bytes
 * don't parse as a recognisable header for the given mime, so callers can
 * treat "can't tell" the same as "reject it" for a hard requirement like
 * squareness.
 */
export function readImageDimensions(
  bytes: Uint8Array,
  mime: string,
): { width: number; height: number } | null {
  try {
    if (mime === "image/png") return readPngDimensions(bytes);
    if (mime === "image/jpeg") return readJpegDimensions(bytes);
    if (mime === "image/webp") return readWebpDimensions(bytes);
  } catch {
    return null;
  }
  return null;
}

/** IHDR is always the first chunk, right after the 8-byte PNG signature:
 * 4-byte length, 4-byte type "IHDR", then 4-byte width + 4-byte height
 * (both big-endian). */
function readPngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  const isIhdr =
    bytes[12] === 0x49 && bytes[13] === 0x48 && bytes[14] === 0x44 && bytes[15] === 0x52;
  if (!isIhdr) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
}

/** Scan markers after SOI (0xFFD8) for a Start Of Frame segment — its first
 * two bytes are sample precision, then a big-endian height, then width. */
function readJpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    // Markers with no payload (RST0-7, SOI, EOI) carry no length field.
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const segmentLength = view.getUint16(offset + 2, false);
    const isSofMarker =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 && // DHT
      marker !== 0xc8 && // JPG (reserved)
      marker !== 0xcc; // DAC
    if (isSofMarker) {
      return { height: view.getUint16(offset + 5, false), width: view.getUint16(offset + 7, false) };
    }
    if (marker === 0xda) return null; // Start of scan — no SOF found before pixel data.
    offset += 2 + segmentLength;
  }
  return null;
}

/** "RIFF"+size+"WEBP" (12 bytes), then a chunk header (4-byte fourCC + size)
 * whose format (VP8X/VP8L/VP8 ) determines how the dimensions are packed. */
function readWebpDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 21) return null; // 12 (RIFF header) + 8 (chunk header) + at least 1 byte of data
  const fourCc = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  const data = 20; // 12 (RIFF header) + 8 (chunk fourCC + size)

  if (fourCc === "VP8X") {
    // flags(1) + reserved(3) + width-1(3, LE) + height-1(3, LE)
    if (bytes.length < data + 10) return null;
    const width = 1 + (bytes[data + 4] | (bytes[data + 5] << 8) | (bytes[data + 6] << 16));
    const height = 1 + (bytes[data + 7] | (bytes[data + 8] << 8) | (bytes[data + 9] << 16));
    return { width, height };
  }
  if (fourCc === "VP8 ") {
    // 3-byte frame tag + 3-byte start code (0x9D 0x01 0x2A), then two
    // 16-bit LE values, each with a 2-bit scale prefix in the top bits.
    if (bytes.length < data + 10) return null;
    if (bytes[data + 3] !== 0x9d || bytes[data + 4] !== 0x01 || bytes[data + 5] !== 0x2a) {
      return null;
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint16(data + 6, true) & 0x3fff;
    const height = view.getUint16(data + 8, true) & 0x3fff;
    return { width, height };
  }
  if (fourCc === "VP8L") {
    // Signature byte (0x2F), then a 32-bit LE bitfield: 14 bits width-1,
    // 14 bits height-1, 1 bit alpha, 3 bits version.
    if (bytes.length < data + 5) return null;
    if (bytes[data] !== 0x2f) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const bits = view.getUint32(data + 1, true);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }
  return null;
}
