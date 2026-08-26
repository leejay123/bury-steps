import type { CSSProperties } from "react";

export const SITE_SETTING_ID = "site";
export const DEFAULT_PRIMARY_COLOR = "#1f3d2b";

export const THEME_PRESETS = [
  { name: "Forest green", hex: "#1f3d2b" },
  { name: "Moss", hex: "#3f6b3a" },
  { name: "Teal", hex: "#0f766e" },
  { name: "Sky", hex: "#0369a1" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Plum", hex: "#6b3a5d" },
  { name: "Burgundy", hex: "#7a2832" },
  { name: "Terracotta", hex: "#9a4a2e" },
  { name: "Ochre", hex: "#8a5a12" },
] as const;

type Rgb = { r: number; g: number; b: number };

export type ThemeCssVars = {
  "--primary": string;
  "--primary-foreground": string;
  "--ring": string;
  "--foreground": string;
  "--secondary": string;
  "--secondary-foreground": string;
  "--muted": string;
  "--muted-foreground": string;
  "--accent": string;
  "--accent-foreground": string;
  "--border": string;
  "--input": string;
};

function hexToRgb(hex: string): Rgb | null {
  const value = hex.replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(value)) return null;
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function mix(a: Rgb, b: Rgb, amountOfB: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * amountOfB),
    g: Math.round(a.g + (b.g - a.g) * amountOfB),
    b: Math.round(a.b + (b.b - a.b) * amountOfB),
  };
}

function channelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb: Rgb): number {
  const r = channelToLinear(rgb.r);
  const g = channelToLinear(rgb.g);
  const b = channelToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: number, b: number): number {
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return (light + 0.05) / (dark + 0.05);
}

export function normalizeHex(input: string): string | null {
  const trimmed = input.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const digits = withHash.slice(1);
  if (/^[0-9A-Fa-f]{3}$/.test(digits)) {
    return `#${digits
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`.toLowerCase();
  }
  if (/^[0-9A-Fa-f]{6}$/.test(digits)) return `#${digits.toLowerCase()}`;
  return null;
}

export function themeCssVars(primaryHex: string): ThemeCssVars {
  const hex = normalizeHex(primaryHex) ?? DEFAULT_PRIMARY_COLOR;
  const primary = hexToRgb(hex) ?? hexToRgb(DEFAULT_PRIMARY_COLOR)!;
  const white = { r: 255, g: 255, b: 255 };
  const ink = { r: 18, g: 24, b: 22 };
  const luma = relativeLuminance(primary);
  const lightText = { r: 247, g: 250, b: 247 };
  const darkText = mix(primary, ink, 0.72);
  const primaryForeground =
    contrastRatio(luma, relativeLuminance(lightText)) >= contrastRatio(luma, relativeLuminance(darkText))
      ? lightText
      : darkText;

  return {
    "--primary": hex,
    "--primary-foreground": rgbToHex(primaryForeground),
    "--ring": hex,
    "--foreground": rgbToHex(mix(primary, ink, 0.78)),
    "--secondary": rgbToHex(mix(primary, white, 0.92)),
    "--secondary-foreground": rgbToHex(mix(primary, ink, 0.72)),
    "--muted": rgbToHex(mix(primary, white, 0.94)),
    "--muted-foreground": rgbToHex(mix(primary, { r: 90, g: 100, b: 96 }, 0.55)),
    "--accent": rgbToHex(mix(primary, white, 0.88)),
    "--accent-foreground": rgbToHex(mix(primary, ink, 0.72)),
    "--border": rgbToHex(mix(primary, white, 0.82)),
    "--input": rgbToHex(mix(primary, white, 0.82)),
  };
}

export function themeStyle(primaryHex: string): CSSProperties {
  return themeCssVars(primaryHex) as CSSProperties;
}
