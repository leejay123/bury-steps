"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSectionBgPattern, type ActionResult } from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { SECTION_BG_PATTERN_LABELS, type SectionBgKey, type SectionBgPattern } from "@/lib/section-background";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** One "Background pattern" dropdown, reused for every homepage section —
 * which SiteSetting column it writes is decided by `section` (see
 * updateSectionBgPattern / SECTION_BG_COLUMNS). Same pattern as
 * CookieConsentSettings: optimistic local state, reset on failure. */
export function SectionBgPatternSelect({
  label = "Background pattern",
  pattern,
  section,
}: {
  label?: string;
  pattern: SectionBgPattern;
  section: SectionBgKey;
}) {
  const [selected, setSelected] = useState(pattern);
  const [state, dispatch, isPending] = useActionState<ActionResult | null, FormData>(
    updateSectionBgPattern,
    null,
  );

  useResetOnChange([pattern], () => setSelected(pattern));
  useResetOnChange([state, pattern], () => {
    if (state && !state.ok) setSelected(pattern);
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast.success(state.message);
    } else {
      toast.error(state.error);
    }
  }, [state]);

  function onChange(next: SectionBgPattern) {
    if (next === selected) return;
    setSelected(next);
    const formData = new FormData();
    formData.set("section", section);
    formData.set("pattern", next);
    startTransition(() => {
      dispatch(formData);
    });
  }

  const id = `bg-pattern-${section}`;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{label}</Label>
        {isPending ? (
          <Loader2 aria-label="Saving" className="size-3.5 animate-spin text-muted-foreground" role="status" />
        ) : null}
      </div>
      <Select disabled={isPending} onValueChange={(value) => onChange(value as SectionBgPattern)} value={selected}>
        <SelectTrigger className="w-full" id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SECTION_BG_PATTERN_LABELS) as SectionBgPattern[]).map((key) => (
            <SelectItem key={key} value={key}>
              {SECTION_BG_PATTERN_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
