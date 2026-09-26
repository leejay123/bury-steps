"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateHeroStyle, type ActionResult } from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { HERO_VIDEO_OPTIONS, type HeroStyle } from "@/lib/hero-style";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSection } from "../settings-page";

const HERO_STYLE_LABELS: Record<HeroStyle, string> = {
  default: "Default (light hero + photo carousel)",
  cinematic: "Video (full-bleed dark hero)",
};

export function HeroStyleSettings({
  heroStyle,
  heroVideoKey,
}: {
  heroStyle: HeroStyle;
  heroVideoKey: string;
}) {
  const [style, setStyle] = useState(heroStyle);
  const [videoKey, setVideoKey] = useState(heroVideoKey);
  const [state, dispatch, isPending] = useActionState<ActionResult | null, FormData>(
    updateHeroStyle,
    null,
  );

  useResetOnChange([heroStyle], () => setStyle(heroStyle));
  useResetOnChange([heroVideoKey], () => setVideoKey(heroVideoKey));

  useResetOnChange([state, heroStyle, heroVideoKey], () => {
    if (state && !state.ok) {
      setStyle(heroStyle);
      setVideoKey(heroVideoKey);
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

  function save(nextStyle: HeroStyle, nextVideoKey: string) {
    const formData = new FormData();
    formData.set("heroStyle", nextStyle);
    formData.set("heroVideoKey", nextVideoKey);
    startTransition(() => {
      dispatch(formData);
    });
  }

  function onStyleChange(next: HeroStyle) {
    if (next === style) return;
    setStyle(next);
    save(next, videoKey);
  }

  function onVideoChange(next: string) {
    if (next === videoKey) return;
    setVideoKey(next);
    save(style, next);
  }

  return (
    <SettingsSection
      description="The banner at the very top of the public homepage. The video option plays on loop behind the site name and tagline instead of the usual light banner and photo carousel."
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

        {style === "cinematic" ? (
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
        ) : null}
      </div>
    </SettingsSection>
  );
}
