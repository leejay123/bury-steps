import { Figtree, Fraunces, Inter, Manrope, Outfit, Source_Serif_4 } from "next/font/google";
import { SITE_FONTS, type SiteFontId } from "@/lib/site-font";

/**
 * Self-hosted with next/font (no request to Google from the browser).
 * preload is off so choosing one face does not download the others up front;
 * a face is fetched when something on the page actually uses it.
 */
export const siteFontFaces = {
  inter: Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-inter" }),
  manrope: Manrope({
    subsets: ["latin"],
    display: "swap",
    preload: false,
    variable: "--font-manrope",
  }),
  figtree: Figtree({
    subsets: ["latin"],
    display: "swap",
    preload: false,
    variable: "--font-figtree",
  }),
  outfit: Outfit({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-outfit" }),
  "source-serif": Source_Serif_4({
    subsets: ["latin"],
    display: "swap",
    preload: false,
    variable: "--font-source-serif",
  }),
  fraunces: Fraunces({
    subsets: ["latin"],
    display: "swap",
    preload: false,
    variable: "--font-fraunces",
  }),
} satisfies Record<SiteFontId, { className: string; variable: string }>;

/** Every face's CSS variable, so the Branding menu can preview each one. */
export const siteFontVariableClassName = SITE_FONTS.map((font) => siteFontFaces[font.id].variable).join(
  " ",
);

export function siteFontFace(id: SiteFontId) {
  return siteFontFaces[id];
}
