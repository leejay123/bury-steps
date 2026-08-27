"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateSiteTheme, type ActionResult } from "@/server/actions";
import {
  DEFAULT_PRIMARY_COLOR,
  THEME_PRESETS,
  normalizeHex,
  themeCssVars,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

function applyThemeVars(hex: string) {
  const root = document.documentElement;
  const vars = themeCssVars(hex);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

function SaveColour() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving…" : "Save colour"}
    </Button>
  );
}

export function AppearanceForm({ primaryColor }: { primaryColor: string }) {
  const router = useRouter();
  const [hex, setHex] = useState(primaryColor);
  const [hexDraft, setHexDraft] = useState(primaryColor);
  const [state, action] = useActionState<ActionResult | null, FormData>(updateSiteTheme, null);

  useEffect(() => {
    setHex(primaryColor);
    setHexDraft(primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    applyThemeVars(hex);
    return () => applyThemeVars(primaryColor);
  }, [hex, primaryColor]);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [router, state]);

  function choose(next: string) {
    const normalized = normalizeHex(next) ?? DEFAULT_PRIMARY_COLOR;
    setHex(normalized);
    setHexDraft(normalized);
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input name="primaryColor" type="hidden" value={hex} />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Presets</p>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => {
            const selected = hex === preset.hex;
            return (
              <button
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent",
                  selected && "border-primary bg-accent",
                )}
                key={preset.hex}
                onClick={() => choose(preset.hex)}
                type="button"
              >
                <span
                  aria-hidden
                  className="size-5 rounded-full border"
                  style={{ backgroundColor: preset.hex }}
                />
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Custom</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="site-colour">Colour</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="Pick a colour"
                  className="size-10 rounded-md border"
                  id="site-colour"
                  style={{ backgroundColor: hex }}
                  type="button"
                />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64">
                <PopoverHeader>
                  <PopoverTitle>Custom colour</PopoverTitle>
                </PopoverHeader>
                <div className="flex flex-col gap-3">
                  <input
                    className="h-24 w-full cursor-pointer rounded-md border bg-transparent p-1"
                    onChange={(event) => choose(event.target.value)}
                    type="color"
                    value={hex}
                  />
                  <Input
                    aria-label="Hex colour"
                    onBlur={() => {
                      const normalized = normalizeHex(hexDraft);
                      if (normalized) choose(normalized);
                      else setHexDraft(hex);
                    }}
                    onChange={(event) => setHexDraft(event.target.value)}
                    spellCheck={false}
                    value={hexDraft}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex min-w-40 flex-1 flex-col gap-1.5">
            <Label htmlFor="site-colour-hex">Hex</Label>
            <Input
              id="site-colour-hex"
              onBlur={() => {
                const normalized = normalizeHex(hexDraft);
                if (normalized) choose(normalized);
                else setHexDraft(hex);
              }}
              onChange={(event) => setHexDraft(event.target.value)}
              spellCheck={false}
              value={hexDraft}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Preview</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button">Primary button</Button>
          <Button type="button" variant="outline">
            Outline
          </Button>
          <Badge>Highlight</Badge>
          <span className="text-sm font-medium text-primary">Link colour</span>
        </div>
      </div>

      <div>
        <SaveColour />
      </div>
    </form>
  );
}
