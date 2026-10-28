/**
 * The shadcn.io design's Customize panel (the wand in its header), as on
 * shadcn.io: a colour theme, a base grey, a style and a corner radius. Each
 * visitor's choice is remembered in their browser and put on <html> as
 * data-sc-* before the first paint; globals.css turns those into colours,
 * fonts and corners. Kept outside any "use client" file so the layout can put
 * the script in the page as plain text.
 */
export const CUSTOMIZE_KEY = "bs-customize";

export const THEMES = [
  "neutral",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;
export const BASES = ["zinc", "neutral", "stone", "mauve", "olive", "mist", "taupe"] as const;
/** shadcn.io's style names; here each one picks a typeface the site already has. */
export const STYLES = [
  { id: "nova", note: "Hanken Grotesk: the shadcn.io look." },
  { id: "vega", note: "Inter: clean and familiar." },
  { id: "maia", note: "Figtree: round and friendly." },
  { id: "lyra", note: "Manrope: tidy and modern." },
  { id: "mira", note: "Outfit: geometric and bold." },
  { id: "luma", note: "Geist: crisp, like Vercel." },
  { id: "sera", note: "Source Serif: a classic serif." },
  { id: "rhea", note: "Fraunces: a warm, old-style serif." },
] as const;
export const RADII = [
  { id: "none", label: "None", preview: 0 },
  { id: "small", label: "Small", preview: 2 },
  { id: "medium", label: "Medium", preview: 4 },
  { id: "large", label: "Large", preview: 6 },
  { id: "default", label: "The style's own", preview: 4 },
] as const;

export type Customize = { theme: string; base: string; style: string; radius: string };
export const DEFAULT_CUSTOMIZE: Customize = { theme: "neutral", base: "neutral", style: "nova", radius: "default" };

const LISTS = [THEMES as readonly string[], BASES as readonly string[], STYLES.map((s) => s.id), RADII.map((r) => r.id)];
const KEYS = ["theme", "base", "style", "radius"] as const;
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** A short code for a set of choices ("b0" is the default), like shadcn.io's --preset. */
export function encodePreset(choice: Customize): string {
  return "b" + KEYS.map((key, i) => ALPHABET[Math.max(0, LISTS[i]!.indexOf(choice[key]))]).join("");
}

export function decodePreset(code: string): Customize | null {
  const raw = code.trim().replace(/^--preset\s*/, "");
  if (!/^b[0-9a-zA-Z]{4}$/.test(raw)) return null;
  const out = { ...DEFAULT_CUSTOMIZE };
  for (let i = 0; i < 4; i++) {
    const value = LISTS[i]![ALPHABET.indexOf(raw[i + 1]!)];
    if (!value) return null;
    out[KEYS[i]!] = value;
  }
  return out;
}

/** Runs before the page paints: the visitor's choices onto <html> (shadcn.io design only). */
export const CUSTOMIZE_SCRIPT = `try{var d=document.documentElement,c=JSON.parse(localStorage.getItem("${CUSTOMIZE_KEY}")||"{}");if(d.getAttribute("data-design")==="shadcnio"){["theme","base","style","radius"].forEach(function(k){if(c[k])d.setAttribute("data-sc-"+k,c[k])})}}catch(e){}`;
