import { Figtree, Fraunces, Inter, Manrope, Outfit, Source_Serif_4 } from "next/font/google";
import { SITE_FONTS, type SiteFontId } from "@/lib/site-font";

/**
 * Self-hosted with next/font (no request to Google from the browser).
 * Each loader has to be its own module-level const — Next rejects calls
 * nested in an object. preload is off so choosing one face does not
 * download the others up front; a face is fetched when the page uses it.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-inter",
});
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-manrope",
});
const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-figtree",
});
const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-outfit",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-source-serif",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-fraunces",
});

export const siteFontFaces = {
  inter,
  manrope,
  figtree,
  outfit,
  "source-serif": sourceSerif,
  fraunces,
} satisfies Record<SiteFontId, { className: string; variable: string }>;

/** Every face's CSS variable, so the Branding menu can preview each one. */
export const siteFontVariableClassName = SITE_FONTS.map((font) => siteFontFaces[font.id].variable).join(
  " ",
);

export function siteFontFace(id: SiteFontId) {
  return siteFontFaces[id];
}
