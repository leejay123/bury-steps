"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSiteFont, type ActionResult } from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { SITE_FONTS, siteFontById, type SiteFontId } from "@/lib/site-font";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSection } from "../settings-page";

const SAMPLE = "Sunday afternoons, Bury and the surrounding countryside.";

export function SiteFontSettings({ font }: { font: SiteFontId }) {
  const [selected, setSelected] = useState(font);
  const [state, dispatch, isPending] = useActionState<ActionResult | null, FormData>(
    updateSiteFont,
    null,
  );
  const current = siteFontById(selected);

  useResetOnChange([font], () => setSelected(font));

  useResetOnChange([state, font], () => {
    if (state && !state.ok) setSelected(font);
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast.success(state.message);
    } else {
      toast.error(state.error);
    }
  }, [state, font]);

  function onFontChange(next: SiteFontId) {
    if (next === selected) return;
    setSelected(next);
    const formData = new FormData();
    formData.set("siteFont", next);
    startTransition(() => {
      dispatch(formData);
    });
  }

  return (
    <SettingsSection
      description="The typeface for the whole website — pages, menus, and drawers. Emails keep their own font."
      title="Site font"
    >
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="site-font">Typeface</Label>
          {isPending ? (
            <Loader2 aria-label="Saving" className="size-3.5 animate-spin text-muted-foreground" role="status" />
          ) : null}
        </div>
        <Select
          disabled={isPending}
          onValueChange={(value) => onFontChange(value as SiteFontId)}
          value={selected}
        >
          <SelectTrigger className="w-full" id="site-font">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SITE_FONTS.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <span style={{ fontFamily: `var(${item.cssVariable}), sans-serif` }}>
                  {item.label}
                  <span className="text-muted-foreground"> — {item.note}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p
          className="rounded-lg border bg-muted/40 px-4 py-3 text-lg leading-snug"
          style={{ fontFamily: `var(${current.cssVariable}), sans-serif` }}
        >
          {SAMPLE}
        </p>
      </div>
    </SettingsSection>
  );
}
