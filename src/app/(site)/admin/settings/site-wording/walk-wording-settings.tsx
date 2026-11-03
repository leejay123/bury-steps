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

/** One box per message: who sees it and when. */
const MESSAGE_BOXES: { title: string; hint: string; key: WalkWordingKey }[] = [
  {
    title: "Members, before clock-in opens",
    hint: "Members who haven't clocked in, until clock-in opens. {opens} and {opensDay} are when.",
    key: "memberBefore",
  },
  {
    title: "Members who didn't clock in, after the walk",
    hint: "Signed-in members once the walk has finished.",
    key: "memberMissed",
  },
  { title: "Visitors, after the walk", hint: "Signed-out visitors once the walk has finished.", key: "visitorFinished" },
  {
    title: "Organisers, after the walk",
    hint: "Organisers who can edit, cancel or manage attendance, once it has finished.",
    key: "organiserFinished",
  },
  {
    title: "Cancelled: heading",
    hint: "Everyone, when the walk is cancelled (in the Status band, just this shows).",
    key: "cancelledTitle",
  },
  {
    title: "Cancelled: what to do next",
    hint: "Members and visitors, after the reason (if one was given).",
    key: "cancelledNext",
  },
];

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
      description="One line for each stage of a walk (shown in the Status band and on every walk page layout), then the walk's messages. Keep the · between a stage's name and the rest. Words in braces, like {opens}, are filled in for each walk."
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
        <fieldset className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <legend className="font-medium">Messages</legend>
            <p className="text-sm text-muted-foreground">
              The walk&apos;s messages, shown to the people they&apos;re for while they apply.
            </p>
          </div>
          {MESSAGE_BOXES.map(({ key, title, hint }) => {
            const changed = draft[key] !== WALK_WORDING_DEFAULTS[key];
            const id = `walk-wording-${key}`;
            return (
              <div className="flex flex-col gap-2" key={key}>
                <Label htmlFor={id}>{title}</Label>
                <div className="flex gap-2">
                  <Input
                    id={id}
                    maxLength={MAX_WALK_WORDING}
                    onChange={(event) => {
                      const text = event.target.value;
                      setDraft((prev) => ({ ...prev, [key]: text }));
                      clearError();
                    }}
                    placeholder={WALK_WORDING_DEFAULTS[key]}
                    value={draft[key]}
                  />
                  {changed ? (
                    <Button
                      aria-label={`Put ${title} back to the standard words`}
                      onClick={() => setDraft((prev) => ({ ...prev, [key]: WALK_WORDING_DEFAULTS[key] }))}
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
                  {hint} {changed ? `Standard: ${WALK_WORDING_DEFAULTS[key]}` : null}
                </p>
              </div>
            );
          })}
        </fieldset>
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
