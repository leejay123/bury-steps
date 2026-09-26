const HERO_STYLES = ["default", "cinematic"] as const;

export type HeroStyle = (typeof HERO_STYLES)[number];

export const DEFAULT_HERO_STYLE: HeroStyle = "default";

export function parseHeroStyle(raw: string | null | undefined): HeroStyle {
  return (HERO_STYLES as readonly string[]).includes(raw ?? "")
    ? (raw as HeroStyle)
    : DEFAULT_HERO_STYLE;
}

export type HeroVideoOption = {
  key: string;
  label: string;
  poster: string;
  src: string;
};

/** Bundled video choices for the cinematic hero — add a file under
 * public/hero-videos and a matching entry here to offer another one. */
export const HERO_VIDEO_OPTIONS: HeroVideoOption[] = [
  { key: "hero-1", label: "Video 1", poster: "/hero-videos/hero-1.jpg", src: "/hero-videos/hero-1.mp4" },
  { key: "hero-2", label: "Video 2", poster: "/hero-videos/hero-2.jpg", src: "/hero-videos/hero-2.mp4" },
  { key: "hero-3", label: "Video 3", poster: "/hero-videos/hero-3.jpg", src: "/hero-videos/hero-3.mp4" },
  { key: "hero-4", label: "Video 4", poster: "/hero-videos/hero-4.jpg", src: "/hero-videos/hero-4.mp4" },
];

export const DEFAULT_HERO_VIDEO_KEY = HERO_VIDEO_OPTIONS[0].key;

export function parseHeroVideoKey(raw: string | null | undefined): string {
  return HERO_VIDEO_OPTIONS.some((option) => option.key === raw)
    ? (raw as string)
    : DEFAULT_HERO_VIDEO_KEY;
}

export function heroVideoSrc(key: string): string {
  return HERO_VIDEO_OPTIONS.find((option) => option.key === key)?.src ?? HERO_VIDEO_OPTIONS[0].src;
}

/** First frame of the chosen video, shown while the file itself starts. */
export function heroVideoPoster(key: string): string {
  return HERO_VIDEO_OPTIONS.find((option) => option.key === key)?.poster ?? HERO_VIDEO_OPTIONS[0].poster;
}

export const DEFAULT_HERO_OVERLAY_OPACITY = 55;

/** Clamps to a whole 0-100 — anything else (bad input, corrupt row) falls
 * back to the default rather than rendering a broken gradient. */
export function parseHeroOverlayOpacity(raw: number | null | undefined): number {
  if (raw === null || raw === undefined || !Number.isFinite(raw)) return DEFAULT_HERO_OVERLAY_OPACITY;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export const DEFAULT_HERO_TEXT_COLOR = "#ffffff";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function parseHeroTextColor(raw: string | null | undefined): string {
  return raw && HEX_COLOR_PATTERN.test(raw) ? raw : DEFAULT_HERO_TEXT_COLOR;
}
