import { getPlaiceholder } from "plaiceholder";

/** A tiny blurred data URL for an uploaded photo. Null when the bytes can't be read. */
export async function photoBlur(bytes: Uint8Array): Promise<string | null> {
  try {
    const { base64 } = await getPlaiceholder(Buffer.from(bytes), { size: 16 });
    return base64.startsWith("data:image/") ? base64 : null;
  } catch (err) {
    console.error("photoBlur", err);
    return null;
  }
}
