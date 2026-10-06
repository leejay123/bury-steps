"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateTextSizes } from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { TEXT_SIZE_FIELDS, type TextSizeKey, type TextSizes } from "@/lib/text-sizes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSection } from "../settings-page";

const PREVIEW: Record<TextSizeKey, string> = {
  headline: "Bury Steps Walking Group",
  section: "How this started",
  intro: "A few words from people who walk with us on Sundays.",
  body: "Sun 4 Oct · 10:00 · Lido Carpark",
};

export function TextSizeSettings({ sizes }: { sizes: TextSizes }) {
  const [selected, setSelected] = useState(sizes);
  const [state, action, isPending] = useSafeActionState(updateTextSizes);

  useResetOnChange([sizes], () => setSelected(sizes));

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast.success(state.message);
    } else {
      toast.error(state.error);
    }
  }, [state]);

  const changed = TEXT_SIZE_FIELDS.some((field) => selected[field.key] !== sizes[field.key]);

  return (
    <SettingsSection
      description="Sizes are for computers. Phones get smaller headings automatically so long titles don't wrap onto several lines."
      title="Text sizes"
    >
      <form action={action} className="flex w-full flex-col gap-5">
        {TEXT_SIZE_FIELDS.map((field) => {
          const id = `text-size-${field.key}`;
          return (
            <div className="flex flex-col gap-2" key={field.key}>
              <Label htmlFor={id}>{field.label}</Label>
              <p className="text-sm text-muted-foreground">{field.hint}</p>
              <input name={field.key} type="hidden" value={selected[field.key]} />
              <Select
                disabled={isPending}
                onValueChange={(value) => setSelected((current) => ({ ...current, [field.key]: Number(value) }))}
                value={String(selected[field.key])}
              >
                <SelectTrigger className="w-full sm:w-48" id={id}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p
                className="truncate rounded-lg border bg-muted/40 px-4 py-3 leading-snug"
                style={{
                  fontSize: `${selected[field.key]}px`,
                  fontWeight: field.key === "headline" || field.key === "section" ? 500 : undefined,
                }}
              >
                {PREVIEW[field.key]}
              </p>
            </div>
          );
        })}
        <div>
          <Button disabled={isPending || !changed} type="submit">
            {isPending ? "Saving…" : "Save text sizes"}
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}
