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
  WALK_WORDING_GROUPS,
  type WalkWording,
} from "@/lib/walk-wording";
import { SettingsSection } from "../settings-page";

/**
 * The words a walk page uses for where the walk is up to: the status line,
 * the countdown and the walk's messages. Each line shows its default and
 * can go back to it; a blank line uses the default too.
 */
export function WalkWordingSettings({ wording }: { wording: WalkWording }) {
  const [draft, setDraft] = useState<WalkWording>(wording);
  const [state, action, isPending, clearError] = useNotifyActionState(updateWalkWording);

  useResetOnChange([wording], () => setDraft(wording));

  const keys = Object.keys(WALK_WORDING_DEFAULTS) as (keyof WalkWording)[];
  const dirty = keys.some((key) => draft[key] !== wording[key]);

  return (
    <SettingsSection
      description="What a walk page says about where the walk is up to, on every layout. Words in braces, like {opens} or {count}, are filled in for each walk. Leave a line blank to use its default."
      title="Walk status wording"
    >
      <form action={action} className="flex flex-col gap-8">
        <input name="wording" type="hidden" value={JSON.stringify(draft)} />
        {WALK_WORDING_GROUPS.map((group) => (
          <fieldset className="flex flex-col gap-5" key={group.title}>
            <div className="flex flex-col gap-1">
              <legend className="font-medium">{group.title}</legend>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
            {group.items.map(({ key, label, hint }) => {
              const value = draft[key];
              const changed = value.trim() !== WALK_WORDING_DEFAULTS[key];
              return (
                <div className="flex flex-col gap-2" key={key}>
                  <Label htmlFor={`walk-wording-${key}`}>{label}</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`walk-wording-${key}`}
                      maxLength={MAX_WALK_WORDING}
                      onChange={(event) => {
                        const next = event.target.value;
                        setDraft((prev) => ({ ...prev, [key]: next }));
                        clearError();
                      }}
                      placeholder={WALK_WORDING_DEFAULTS[key]}
                      value={value}
                    />
                    {changed ? (
                      <Button
                        aria-label={`Put “${label}” back to its default`}
                        onClick={() => setDraft((prev) => ({ ...prev, [key]: WALK_WORDING_DEFAULTS[key] }))}
                        size="icon"
                        title="Back to the default"
                        type="button"
                        variant="outline"
                      >
                        <RotateCcw />
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hint ? `${hint} ` : ""}
                    {changed ? `Default: ${WALK_WORDING_DEFAULTS[key]}` : null}
                  </p>
                </div>
              );
            })}
          </fieldset>
        ))}
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
