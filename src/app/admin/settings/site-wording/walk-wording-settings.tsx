"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { updateWalkWording } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_WALK_WORDING,
  WALK_WORDING_DEFAULTS,
  type WalkWording,
  type WalkWordingKey,
} from "@/lib/walk-wording";

/** One box per status: its name and the rest, written "Name · the rest". */
const STATUS_BOXES: { title: string; hint: string; name: WalkWordingKey; rest: WalkWordingKey }[] = [
  {
    title: "Upcoming",
    hint: "Until an hour before the start. {opens} is when clock-in opens.",
    name: "upcomingLabel",
    rest: "upcomingLine",
  },
  {
    title: "Clock-in open",
    hint: "From an hour before until the start. {start} is the start time.",
    name: "openLabel",
    rest: "openLine",
  },
  {
    title: "In progress",
    hint: "From the start until the finish. {finish} is the finish time.",
    name: "liveLabel",
    rest: "liveLine",
  },
  {
    title: "Finished",
    hint: "After the finish. {count} is how many came.",
    name: "finishedLabel",
    rest: "finishedAttended",
  },
  { title: "Cancelled", hint: "When the walk is called off.", name: "cancelledLabel", rest: "cancelledLine" },
];
import { SettingsSection } from "../settings-page";

/**
 * The words a walk page uses for where the walk is up to: one box per
 * stage ("Name · the rest"). The countdown, counts and messages keep their
 * standard (or already saved) words.
 */
export function WalkWordingSettings({ wording }: { wording: WalkWording }) {
  const [draft, setDraft] = useState<WalkWording>(wording);
  // What's typed in each box, as typed (split into name and rest for saving).
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [state, action, isPending, clearError] = useNotifyActionState(updateWalkWording);

  useResetOnChange([wording], () => {
    setDraft(wording);
    setTyped({});
  });

  const keys = Object.keys(WALK_WORDING_DEFAULTS) as (keyof WalkWording)[];
  const dirty = keys.some((key) => draft[key] !== wording[key]);

  return (
    <SettingsSection
      description="One line for each stage of a walk, shown in the Status band and on every walk page layout. Keep the · between the name and the rest. Words in braces, like {opens}, are filled in for each walk."
      title="Walk status wording"
    >
      <form action={action} className="flex flex-col gap-8">
        <input name="wording" type="hidden" value={JSON.stringify(draft)} />
        <div className="flex flex-col gap-5">
          {STATUS_BOXES.map(({ title, hint, name, rest }) => {
            const value = typed[name] ?? `${draft[name]} · ${draft[rest]}`;
            const standard = `${WALK_WORDING_DEFAULTS[name]} · ${WALK_WORDING_DEFAULTS[rest]}`;
            const changed = draft[name] !== WALK_WORDING_DEFAULTS[name] || draft[rest] !== WALK_WORDING_DEFAULTS[rest];
            const id = `walk-wording-${name}`;
            return (
              <div className="flex flex-col gap-2" key={name}>
                <Label htmlFor={id}>{title}</Label>
                <div className="flex gap-2">
                  <Input
                    id={id}
                    maxLength={MAX_WALK_WORDING * 2}
                    onChange={(event) => {
                      // "Name · the rest": split at the first dot.
                      const text = event.target.value;
                      const [first, ...others] = text.split("·");
                      setTyped((prev) => ({ ...prev, [name]: text }));
                      setDraft((prev) => ({
                        ...prev,
                        [name]: (first ?? "").trim(),
                        [rest]: others.join("·").trim(),
                      }));
                      clearError();
                    }}
                    placeholder={standard}
                    value={value}
                  />
                  {changed ? (
                    <Button
                      aria-label={`Put ${title} back to the standard words`}
                      onClick={() => {
                        setTyped((prev) => {
                          const next = { ...prev };
                          delete next[name];
                          return next;
                        });
                        setDraft((prev) => ({
                          ...prev,
                          [name]: WALK_WORDING_DEFAULTS[name],
                          [rest]: WALK_WORDING_DEFAULTS[rest],
                        }));
                      }}
                      size="icon"
                      title="Back to the standard words"
                      type="button"
                      variant="outline"
                    >
                      <RotateCcw />
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hint} {changed ? `Standard: ${standard}` : null}
                </p>
              </div>
            );
          })}
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <div className="flex flex-wrap gap-2">
          <Button disabled={!dirty || isPending} type="submit">
            {isPending ? "Saving…" : "Save"}
          </Button>
          {dirty ? (
            <Button
              disabled={isPending}
              onClick={() => {
                setDraft(wording);
                setTyped({});
                clearError();
              }}
              type="button"
              variant="outline"
            >
              Discard
            </Button>
          ) : null}
        </div>
      </form>
    </SettingsSection>
  );
}
