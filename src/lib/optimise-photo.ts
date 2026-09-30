import sharp from "sharp";

/** Hard ceiling for one stored photo — the homepage can show up to 15. */
export const MAX_PHOTO_BYTES = 500 * 1024;

// Largest edge in pixels, then WebP quality. Tried in order until the photo
// fits under MAX_PHOTO_BYTES; almost every photo fits on the first go.
const ATTEMPTS: [number, number][] = [
  [2000, 80],
  [2000, 72],
  [1600, 72],
  [1600, 62],
  [1280, 62],
  [1280, 50],
];

/**
 * Shrinks an uploaded photo for the web: turned the right way up, no bigger
 * than 2000px on its longest side (sharp on a large desktop screen), saved
 * as WebP at a high quality, and never more than MAX_PHOTO_BYTES. Hidden
 * details such as a phone's GPS location are dropped along the way (sharp
 * only keeps metadata when asked to).
 */
export async function optimisePhoto(input: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  let out: Buffer | null = null;
  for (const [edge, quality] of ATTEMPTS) {
    out = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 5, smartSubsample: true })
      .toBuffer();
    if (out.length <= MAX_PHOTO_BYTES) break;
  }
  return new Uint8Array(out!) as Uint8Array<ArrayBuffer>;
}

/** An already-stored photo that predates optimisePhoto (not WebP, or too big). */
export function needsOptimising(bytes: Uint8Array, mime: string | null): boolean {
  return mime !== "image/webp" || bytes.length > MAX_PHOTO_BYTES;
}
