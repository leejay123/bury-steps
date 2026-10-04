import { Figtree, Fraunces, Geist, Geist_Mono, Inter, Manrope, Outfit, Source_Serif_4 } from "next/font/google";
import { SITE_FONTS, type SiteFontId } from "@/lib/site-font";

/**
 * Self-hosted with next/font (no request to Google from the browser).
 * Each loader has to be its own module-level const — Next rejects calls
 * nested in an object. preload is off so choosing one face does not
 * download the others up front; a face is fetched when the page uses it.
 * `optional` keeps a refresh from painting a fallback face and then snapping
 * to the real one (that snap is a layout shift). A cached face is used
 * immediately; if it is not ready in time, this view stays on the fallback.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "optional",
  preload: false,
  variable: "--font-inter",
});
const manrope = Manrope({
  subsets: ["latin"],
  display: "optional",
  preload: false,
  variable: "--font-manrope",
});
const figtree = Figtree({
  subsets: ["latin"],
  display: "optional",
  preload: false,
  variable: "--font-figtree",
});
const outfit = Outfit({
  subsets: ["latin"],
  display: "optional",
  preload: false,
  variable: "--font-outfit",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "optional",
  preload: false,
  variable: "--font-source-serif",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "optional",
  preload: false,
  variable: "--font-fraunces",
});

// shadcn's docs site font: the mobile menu, and shadcn/typeset's .typeset-docs.
export const menuFont = Geist({
  subsets: ["latin"],
  display: "optional",
  preload: false,
  variable: "--font-geist",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "optional",
  preload: false,
  variable: "--font-geist-mono",
});

/** --font-geist and --font-geist-mono for shadcn/typeset. */
export const typesetFontVariables = `${menuFont.variable} ${geistMono.variable}`;

export const siteFontFaces = {
  inter,
  geist: menuFont,
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
