"use client";

import { startTransition, useState } from "react";
import { updateWalkPageLayout } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WALK_GALLERY_LAYOUTS,
  WALK_STUDIO_LAYOUTS,
  WALK_IDEA_LAYOUTS,
  joinWalkPageChoice,
  type WalkHeaderStyle,
  type WalkPageLayout,
} from "@/lib/walk-page-sections";
import { SettingsSection } from "../settings-page";

const TABBED = [
  { id: "strip", label: "A · Action strip" },
  { id: "sticky", label: "B · Sticky tab bar" },
  { id: "status", label: "C · Status first" },
  { id: "tiles", label: "D · Summary tiles" },
] as const;

const HEADERS = [
  { id: "buttons", label: "H1 buttons beside the name" },
  { id: "toolbar", label: "H2 toolbar above the name" },
  { id: "band", label: "H3 status band + Manage" },
  { id: "grouped", label: "H4 grouped controls" },
] as const;

/**
 * Every walk page design in one list — the layouts, A to D each with or
 * without a header style, and designs 1 to 20 — saved as soon as one is
 * picked, like Phone menu in Site behaviour.
 */
export function WalkPageLayoutSettings({ header, layout }: { header: WalkHeaderStyle; layout: WalkPageLayout }) {
  const saved = joinWalkPageChoice(layout, header);
  const [value, setValue] = useState(saved);
  const [state, action] = useSafeActionState(updateWalkPageLayout);
  // No inline error box here, so a failed save says so in a toast.
  useActionToast(state, undefined, { toastErrors: true });
  useResetOnChange([saved], () => setValue(saved));
  useResetOnChange([state], () => {
    if (state && !state.ok) setValue(saved);
  });

  return (
    <SettingsSection
      description="How a walk's page looks when someone opens a walk — the same for members and organisers. Designed uses what you build in the walk page designer (Design this page, on any organiser walk page). One list for every design: the original one column, two columns, A to D (one column with tabs, each also with a header style H1 to H4), and designs 1 to 81 to try, grouped by look. The Details first designs (52 to 81) start with the messages and one card holding everything about the walk, with all the walk's actions in one Manage button."
      title="Layout"
    >
      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="walk-page-layout">Layout</Label>
        <Select
          onValueChange={(next) => {
            setValue(next);
            const formData = new FormData();
            formData.set("walkPageLayout", next);
            startTransition(() => action(formData));
          }}
          value={value}
        >
          <SelectTrigger className="w-full sm:w-[26rem]" id="walk-page-layout">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Your own</SelectLabel>
              <SelectItem value="designed">Designed (in the walk page designer)</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Original</SelectLabel>
              <SelectItem value="classic">One column (original)</SelectItem>
              <SelectItem value="columns">Two columns with tabs</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            {TABBED.map((tabbed) => (
              <SelectGroup key={tabbed.id}>
                <SelectLabel>{tabbed.label}</SelectLabel>
                <SelectItem value={tabbed.id}>{tabbed.label}</SelectItem>
                {HEADERS.map((headerStyle) => (
                  <SelectItem key={headerStyle.id} value={`${tabbed.id}:${headerStyle.id}`}>
                    {`${tabbed.label.slice(0, 1)} + ${headerStyle.label}`}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>More designs</SelectLabel>
              {WALK_IDEA_LAYOUTS.map((idea, i) => (
                <SelectItem key={idea.id} value={idea.id}>
                  {`${i + 1} · ${idea.label}`}
                </SelectItem>
              ))}
            </SelectGroup>
            {(["Map in the card", "Full width", "With a sidebar", "Compact and neat"] as const).map((look) => (
              <SelectGroup key={look}>
                <SelectSeparator />
                <SelectLabel>{`Details first · ${look}`}</SelectLabel>
                {WALK_STUDIO_LAYOUTS.map((design, i) =>
                  design.look === look ? (
                    <SelectItem key={design.id} value={design.id}>
                      {`${WALK_IDEA_LAYOUTS.length + WALK_GALLERY_LAYOUTS.length + i + 1} · ${design.label}`}
                    </SelectItem>
                  ) : null,
                )}
              </SelectGroup>
            ))}
            {(["Polished app", "Clean and minimal", "Bold outdoors", "Organiser dashboard"] as const).map((look) => (
              <SelectGroup key={look}>
                <SelectSeparator />
                <SelectLabel>{look}</SelectLabel>
                {WALK_GALLERY_LAYOUTS.map((design, i) =>
                  design.look === look ? (
                    <SelectItem key={design.id} value={design.id}>
                      {`${WALK_IDEA_LAYOUTS.length + i + 1} · ${design.label}`}
                    </SelectItem>
                  ) : null,
                )}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
    </SettingsSection>
  );
}
