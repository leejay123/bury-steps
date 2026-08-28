/**
 * Strip metadata (EXIF, which on a phone photo usually includes exact GPS
 * coordinates; XMP; free-text comments) from an uploaded image before it's
 * stored. These are public-facing photos (homepage carousel, testimonials)
 * — nothing about where organisers or members were standing when a photo
 * was taken should be published along with it.
 *
 * This only removes metadata *segments/chunks*; it never touches or
 * re-encodes pixel data, so there's no quality loss. If a file doesn't
 * match the expected structure for its type, the original bytes are
 * returned unchanged rather than risking a corrupted image — this is a
 * privacy hardening pass, not something that should ever break an upload.
 */
export function stripImageMetadata(bytes: Uint8Array, mime: string): Uint8Array {
  try {
    if (mime === "image/jpeg") return stripJpegMetadata(bytes);
    if (mime === "image/png") return stripPngMetadata(bytes);
    if (mime === "image/webp") return stripWebpMetadata(bytes);
  } catch {
    return bytes;
  }
  return bytes;
}

function concat(segments: Uint8Array[]): Uint8Array {
  const total = segments.reduce((sum, seg) => sum + seg.length, 0);
  const result = new Uint8Array(total);
  let pos = 0;
  for (const seg of segments) {
    result.set(seg, pos);
    pos += seg.length;
  }
  return result;
}

/**
 * JPEG is a sequence of markers (0xFF + a code) after the SOI (0xFFD8).
 * Metadata lives in APP1 (0xE1 — EXIF and/or Adobe XMP, both of which can
 * carry geotags) and COM (0xFE — free-text comments) segments, all of
 * which appear before the scan data starts (SOS, 0xDA). Everything else
 * (APP0/JFIF, APP2/ICC colour profile, quantization/Huffman tables, the
 * scan data itself) is left untouched.
 */
function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;

  const segments: Uint8Array[] = [bytes.subarray(0, 2)];
  let offset = 2;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff || offset + 1 >= bytes.length) {
      segments.push(bytes.subarray(offset));
      break;
    }
    const marker = bytes[offset + 1];

    // Start of scan: everything from here on is entropy-coded image data,
    // not further markers we need to inspect.
    if (marker === 0xda) {
      segments.push(bytes.subarray(offset));
      break;
    }

    // Markers with no payload (restart markers, TEM). Not expected before
    // SOS in practice, but handled so we never misread the byte stream.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      segments.push(bytes.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }

    if (offset + 4 > bytes.length) {
      segments.push(bytes.subarray(offset));
      break;
    }

    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    const segmentEnd = offset + 2 + length;
    if (length < 2 || segmentEnd > bytes.length) {
      segments.push(bytes.subarray(offset));
      break;
    }

    const isMetadata = marker === 0xe1 || marker === 0xfe;
    if (!isMetadata) {
      segments.push(bytes.subarray(offset, segmentEnd));
    }
    offset = segmentEnd;
  }

  return concat(segments);
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
/** eXIf (added to the PNG spec in 2017) and the text chunks, which can carry
 * arbitrary key/value metadata including an embedded XMP geotag. */
const PNG_METADATA_TYPES = new Set(["eXIf", "tEXt", "zTXt", "iTXt"]);

function stripPngMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 8 || !PNG_SIGNATURE.every((byte, i) => bytes[i] === byte)) return bytes;

  const segments: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;

  while (offset + 8 <= bytes.length) {
    const length =
      ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );
    const chunkEnd = offset + 8 + length + 4;
    if (chunkEnd > bytes.length) {
      segments.push(bytes.subarray(offset));
      break;
    }

    if (!PNG_METADATA_TYPES.has(type)) {
      segments.push(bytes.subarray(offset, chunkEnd));
    }
    offset = chunkEnd;
    if (type === "IEND") break;
  }
  if (offset < bytes.length) {
    segments.push(bytes.subarray(offset));
  }

  return concat(segments);
}

/**
 * WebP is a RIFF container: "RIFF" + 4-byte size + "WEBP", then chunks of
 * [4-byte FourCC][4-byte little-endian size][data, padded to an even
 * length]. EXIF and XMP chunks are metadata; the RIFF size field (which
 * covers everything after the first 8 bytes) is fixed up afterwards since
 * removing chunks changes the file's total length.
 */
function stripWebpMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 12) return bytes;
  const isRiff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (!isRiff || !isWebp) return bytes;

  const segments: Uint8Array[] = [bytes.subarray(0, 12)];
  let offset = 12;
  let removedAny = false;

  while (offset + 8 <= bytes.length) {
    const fourCc = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    );
    const size =
      (bytes[offset + 4] | (bytes[offset + 5] << 8) | (bytes[offset + 6] << 16) | (bytes[offset + 7] << 24)) >>>
      0;
    const paddedSize = size + (size % 2);
    const chunkEnd = offset + 8 + paddedSize;
    if (chunkEnd > bytes.length) {
      segments.push(bytes.subarray(offset));
      break;
    }

    if (fourCc === "EXIF" || fourCc === "XMP ") {
      removedAny = true;
    } else {
      segments.push(bytes.subarray(offset, chunkEnd));
    }
    offset = chunkEnd;
  }
  if (offset < bytes.length) {
    segments.push(bytes.subarray(offset));
  }

  if (!removedAny) return bytes;

  const result = concat(segments);
  const riffSize = result.length - 8;
  result[4] = riffSize & 0xff;
  result[5] = (riffSize >>> 8) & 0xff;
  result[6] = (riffSize >>> 16) & 0xff;
  result[7] = (riffSize >>> 24) & 0xff;
  return result;
}
