"use client";

import { startTransition, useActionState, useState } from "react";
import { updateSliderHeroWords, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SliderHeroWords } from "@/lib/hero-style";
import { SettingsSection } from "../settings-page";

/** Saves as soon as a choice is picked, like the switches on this page. */
export function SliderHeroWordsSettings({ words }: { words: SliderHeroWords }) {
  const [value, setValue] = useState(words);
  const [state, action] = useActionState<ActionResult | null, FormData>(updateSliderHeroWords, null);
  useActionToast(state);
  useResetOnChange([words], () => setValue(words));
  useResetOnChange([state], () => {
    if (state && !state.ok) setValue(words);
  });

  return (
    <SettingsSection
      description="For the Photo slider hero only. Each photo's own heading and text are set in Hero photos; photos left blank show just the picture."
      title="Words on the photo slider hero"
    >
      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="slider-hero-words">Show</Label>
        <Select
          onValueChange={(next) => {
            setValue(next as SliderHeroWords);
            const formData = new FormData();
            formData.set("sliderHeroWords", next);
            startTransition(() => action(formData));
          }}
          value={value}
        >
          <SelectTrigger className="w-full sm:w-[22rem]" id="slider-hero-words">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="site">Site name and tagline on every photo</SelectItem>
            <SelectItem value="slides">Each photo&apos;s own words</SelectItem>
            <SelectItem value="none">No words — just the photos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SettingsSection>
  );
}
