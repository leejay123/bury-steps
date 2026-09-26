/**
 * Site-wide typefaces. The faces themselves are loaded with next/font in
 * src/app/fonts.ts and applied from the root layout. Ids are stored on
 * SiteSetting.siteFont.
 */
export const SITE_FONTS = [
  { id: "inter", label: "Inter", note: "Clean sans", cssVariable: "--font-inter" },
  { id: "manrope", label: "Manrope", note: "Geometric sans", cssVariable: "--font-manrope" },
  { id: "figtree", label: "Figtree", note: "Friendly sans", cssVariable: "--font-figtree" },
  { id: "outfit", label: "Outfit", note: "Modern sans", cssVariable: "--font-outfit" },
  { id: "source-serif", label: "Source Serif", note: "Reading serif", cssVariable: "--font-source-serif" },
  { id: "fraunces", label: "Fraunces", note: "Soft serif", cssVariable: "--font-fraunces" },
] as const;

export type SiteFontId = (typeof SITE_FONTS)[number]["id"];

export const DEFAULT_SITE_FONT: SiteFontId = "inter";

export function parseSiteFont(value: string): SiteFontId | null {
  const match = SITE_FONTS.find((font) => font.id === value);
  return match ? match.id : null;
}

export function siteFontById(id: string) {
  return SITE_FONTS.find((font) => font.id === id) ?? SITE_FONTS[0];
}
