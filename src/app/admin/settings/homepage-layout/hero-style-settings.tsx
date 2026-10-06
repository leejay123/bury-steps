"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateHeroStyle } from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { HERO_VIDEO_OPTIONS, type HeroStyle } from "@/lib/hero-style";
import type { SectionBgPattern } from "@/lib/section-background";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSection } from "../settings-page";
import { SectionBgPatternSelect } from "./section-bg-pattern-select";

const HERO_STYLE_LABELS: Record<HeroStyle, string> = {
  default: "Default (light hero)",
  cinematic: "Video (full-bleed dark hero)",
  globe: "Globe (live numbers + photo slider)",
  parallax: "Parallax (photo cards that slide as you scroll)",
  marquee: "3D Marquee (tilted wall of scrolling photos)",
  slider: "Photo slider (your photos full width, words on top)",
  strip: "Sideways strip (a row of photos that slides as you scroll)",
  tiles: "Tiles fall into place (photos settle into a grid)",
  diagonal: "Diagonal rows (slanted rows of photos sliding past)",
  accordion: "Accordion panels (photo strips that open one at a time)",
};

/** Hero styles with open space behind the name for a background pattern
 * (the others fill it with a video, globe or photos). */
const HEROES_WITH_BACKGROUND: HeroStyle[] = ["default", "strip", "tiles", "accordion"];

/** How many Hero photos each photo hero shows. */
const HERO_PHOTO_COUNTS: Partial<Record<HeroStyle, string>> = {
  parallax: "Shows 12 photos",
  marquee: "Shows 15 photos",
  slider: "Shows all your photos",
  strip: "Shows 10 photos",
  tiles: "Shows 8 photos",
  diagonal: "Shows 12 photos",
  accordion: "Shows 5 photos",
};

/** How long to wait after the last drag/typing tick before saving the
 * slider or color picker — these fire continuously while the pointer
 * moves, and saving on every tick would spam the server. */
const COMMIT_DEBOUNCE_MS = 400;

export function HeroStyleSettings({
  heroBgPattern,
  heroOverlayOpacity,
  heroStyle,
  heroTextColor,
  heroVideoKey,
}: {
  heroBgPattern: SectionBgPattern;
  heroOverlayOpacity: number;
  heroStyle: HeroStyle;
  heroTextColor: string;
  heroVideoKey: string;
}) {
  const [style, setStyle] = useState(heroStyle);
  const [videoKey, setVideoKey] = useState(heroVideoKey);
  const [overlayOpacity, setOverlayOpacity] = useState(heroOverlayOpacity);
  const [textColor, setTextColor] = useState(heroTextColor);
  const [state, dispatch, isPending] = useSafeActionState(updateHeroStyle);
  const commitTimerRef = useRef(0);

  useResetOnChange([heroStyle], () => setStyle(heroStyle));
  useResetOnChange([heroVideoKey], () => setVideoKey(heroVideoKey));
  useResetOnChange([heroOverlayOpacity], () => setOverlayOpacity(heroOverlayOpacity));
  useResetOnChange([heroTextColor], () => setTextColor(heroTextColor));

  useResetOnChange([state, heroStyle, heroVideoKey, heroOverlayOpacity, heroTextColor], () => {
    if (state && !state.ok) {
      setStyle(heroStyle);
      setVideoKey(heroVideoKey);
      setOverlayOpacity(heroOverlayOpacity);
      setTextColor(heroTextColor);
    }
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast.success(state.message);
    } else {
      toast.error(state.error);
    }
  }, [state]);

  useEffect(() => {
    return () => window.clearTimeout(commitTimerRef.current);
  }, []);

  function save(
    nextStyle: HeroStyle,
    nextVideoKey: string,
    nextOverlayOpacity: number,
    nextTextColor: string,
  ) {
    const formData = new FormData();
    formData.set("heroStyle", nextStyle);
    formData.set("heroVideoKey", nextVideoKey);
    formData.set("heroOverlayOpacity", String(nextOverlayOpacity));
    formData.set("heroTextColor", nextTextColor);
    startTransition(() => {
      dispatch(formData);
    });
  }

  function saveDebounced(
    nextStyle: HeroStyle,
    nextVideoKey: string,
    nextOverlayOpacity: number,
    nextTextColor: string,
  ) {
    window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = window.setTimeout(() => {
      save(nextStyle, nextVideoKey, nextOverlayOpacity, nextTextColor);
    }, COMMIT_DEBOUNCE_MS);
  }

  function onStyleChange(next: HeroStyle) {
    if (next === style) return;
    setStyle(next);
    save(next, videoKey, overlayOpacity, textColor);
  }

  function onVideoChange(next: string) {
    if (next === videoKey) return;
    setVideoKey(next);
    save(style, next, overlayOpacity, textColor);
  }

  function onOverlayOpacityChange(next: number) {
    setOverlayOpacity(next);
    saveDebounced(style, videoKey, next, textColor);
  }

  function onTextColorChange(next: string) {
    setTextColor(next);
    saveDebounced(style, videoKey, overlayOpacity, next);
  }

  return (
    <SettingsSection
      description="The top of the public homepage: the light Default banner, a looping Video, the Globe, or one of the photo heroes — Photo slider, Parallax, 3D Marquee, Sideways strip, Tiles, Diagonal rows and Accordion — which use your Hero photos."
      title="Hero style"
    >
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="hero-style">Style</Label>
            {isPending ? (
              <Loader2 aria-label="Saving" className="size-3.5 animate-spin text-muted-foreground" role="status" />
            ) : null}
          </div>
          <Select disabled={isPending} onValueChange={(value) => onStyleChange(value as HeroStyle)} value={style}>
            <SelectTrigger className="w-full" id="hero-style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(HERO_STYLE_LABELS) as HeroStyle[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {HERO_STYLE_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {HEROES_WITH_BACKGROUND.includes(style) ? (
          <SectionBgPatternSelect pattern={heroBgPattern} section="hero" />
        ) : null}

        {HERO_PHOTO_COUNTS[style] ? (
          <p className="text-sm text-muted-foreground">
            {HERO_PHOTO_COUNTS[style]}{" "}
            from Hero photos; any gaps use sample walking photos until you add your own.{" "}
            <Link className="font-medium text-foreground underline underline-offset-4" href="/admin/settings/hero-photos">
              Change these photos
            </Link>
          </p>
        ) : null}

        {style === "cinematic" ? (
          <>
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="hero-video">Video</Label>
              <Select disabled={isPending} onValueChange={onVideoChange} value={videoKey}>
                <SelectTrigger className="w-full" id="hero-video">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HERO_VIDEO_OPTIONS.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="hero-overlay-opacity">Overlay darkness — {overlayOpacity}%</Label>
              <Slider
                id="hero-overlay-opacity"
                max={100}
                min={0}
                onValueChange={([next]) => onOverlayOpacityChange(next)}
                step={1}
                value={[overlayOpacity]}
              />
              <p className="text-xs text-muted-foreground">
                How dark the gradient over the video is — higher makes the text easier to read but the video less
                visible.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="hero-text-color">Text color</Label>
              <div className="flex items-center gap-2">
                <input
                  className="size-9 shrink-0 cursor-pointer rounded-md border p-0.5"
                  id="hero-text-color"
                  onChange={(event) => onTextColorChange(event.target.value)}
                  type="color"
                  value={textColor}
                />
                <span className="text-sm text-muted-foreground">{textColor}</span>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </SettingsSection>
  );
}
