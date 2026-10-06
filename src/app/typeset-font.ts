import { Geist } from "next/font/google";

/**
 * The same Geist face as `menuFont` in fonts.ts, but preloaded. Pages that
 * open on a `.typeset-docs` block (the Guide, Privacy and Terms) use this so
 * the font is already there when the text first paints — otherwise it
 * arrived a moment later, rewrapped the text and pushed everything below it
 * down. It is the same file, so nothing downloads twice; other pages don't
 * import this and don't fetch it up front.
 */
export const typesetFont = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});
