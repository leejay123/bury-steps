"use client";

import { createContext, useContext, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { ExtraFactsField } from "./extra-facts-field";
import type { ExtraFact } from "@/lib/extra-facts";
import { utcToLondonWallClock } from "@/lib/dates";
import { DateTimePicker } from "@/components/date-time-picker";
import { MeetingPointFields } from "@/components/meeting-point-fields";
import { DrawerFormFooter, FieldHint, FormSection } from "@/components/drawer-form";
import { essentialIcon } from "@/lib/walk-essentials";
import { useWalkEssentials } from "@/components/walk-essentials-context";
import { WalkDescriptionField } from "./walk-description-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WALK_LENGTH_OPTIONS = [30, 45, 60, 90, 120, 150, 180, 240];
const WALK_GRADE_OPTIONS = ["Easy", "Moderate", "Hard"];

function walkLengthLabel(mins: number): string {
  return mins < 60 ? `${mins} minutes` : `${mins / 60} ${mins === 60 ? "hour" : "hours"}`;
}

// Other length: the server takes 15 minutes to 10 hours.
const OTHER_LENGTH = "other";
const LENGTH_HOURS = Array.from({ length: 11 }, (_, hour) => String(hour));
const LENGTH_MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

/**
 * Expected length: the usual lengths in a list, and Other length for any
 * other, picked as hours and minutes in their own boxes underneath.
 */
function WalkLengthField({
  defaultMins,
  disabled,
  id,
}: {
  defaultMins: number;
  disabled: boolean;
  id: string;
}) {
  const preset = WALK_LENGTH_OPTIONS.includes(defaultMins);
  const [choice, setChoice] = useState(preset ? String(defaultMins) : OTHER_LENGTH);
  const [hours, setHours] = useState(String(Math.floor(defaultMins / 60)));
  const [minutes, setMinutes] = useState(String(defaultMins % 60).padStart(2, "0"));
  const other = choice === OTHER_LENGTH;
  // An older walk saved at an odd minute keeps it as a choice.
  const minuteOptions = (LENGTH_MINUTES.includes(minutes) ? LENGTH_MINUTES : [...LENGTH_MINUTES, minutes].sort())
    // At least 15 minutes, at most 10 hours.
    .filter((item) => (hours === "0" ? Number(item) >= 15 : hours === "10" ? item === "00" : true));
  const shownMinutes = minuteOptions.includes(minutes) ? minutes : minuteOptions[0];
  const value = other ? String(Number(hours) * 60 + Number(shownMinutes)) : choice;

  return (
    <div className="flex flex-col gap-2">
      <input name="durationMins" type="hidden" value={value} />
      <Select
        disabled={disabled}
        onValueChange={(next) => {
          setChoice(next);
          // Other length starts from the length last chosen.
          if (next === OTHER_LENGTH && choice !== OTHER_LENGTH) {
            setHours(String(Math.floor(Number(choice) / 60)));
            setMinutes(String(Number(choice) % 60).padStart(2, "0"));
          }
        }}
        value={choice}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WALK_LENGTH_OPTIONS.map((mins) => (
            <SelectItem key={mins} value={String(mins)}>
              {walkLengthLabel(mins)}
            </SelectItem>
          ))}
          <SelectItem value={OTHER_LENGTH}>Other length…</SelectItem>
        </SelectContent>
      </Select>
      {other ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-hours`}>Hours</Label>
            <Select disabled={disabled} onValueChange={setHours} value={hours}>
              <SelectTrigger id={`${id}-hours`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LENGTH_HOURS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-minutes`}>Minutes</Label>
            <Select disabled={disabled} onValueChange={setMinutes} value={shownMinutes}>
              <SelectTrigger id={`${id}-minutes`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minuteOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type WalkFormDefaults = {
  title: string;
  /** ISO string. */
  startsAt: string;
  durationMins: number;
  description: string | null;
  distance: string | null;
  grade: string | null;
  elevationGain: string | null;
  essentials: string[];
  walkLeader: string | null;
  backMarker: string | null;
  refreshmentStop?: string | null;
  extraFacts?: ExtraFact[];
  location: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  what3words: string | null;
};

/**
 * The fields of a walk — the one form behind both Create a walk and Edit
 * walk, so the two always ask for the same things in the same order:
 * title, then When / Where / Details. `defaults` is the walk being edited
 * (absent when creating). `scheduleLocked` — the walk has started, so date,
 * time and length can no longer change (updateWalk keeps the stored values
 * regardless of what's posted).
 */
/** The walk form's steps, in order (their names show above each). */
const WALK_STEPS = ["Title and when", "Where", "Details", "Description"];

type Steps = {
  step: number;
  go: (n: number) => void;
  /** Next, if the boxes on this step are filled in properly. */
  next: () => void;
  root: React.RefObject<HTMLDivElement | null>;
};
const StepsContext = createContext<Steps | null>(null);

/**
 * Around a drawer's walk form: the form one step at a time, with Back and
 * Next in place of Save until the last step (WalkStepsFooter).
 */
export function WalkFormSteps({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const go = (n: number) => {
    setStep(n);
    // Back to the top of the drawer for the new step.
    let el: HTMLElement | null = root.current;
    while (el && !["auto", "scroll"].includes(getComputedStyle(el).overflowY)) el = el.parentElement;
    if (el) el.scrollTop = 0;
  };
  const next = () => {
    const panel = root.current?.querySelector<HTMLElement>(`[data-walk-step="${step}"]`);
    const fields = Array.from(
      panel?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea") ?? [],
    );
    // The first box that isn't right says so (as Save would).
    const wrong = fields.find((field) => field.willValidate && !field.checkValidity());
    if (wrong) {
      wrong.reportValidity();
      return;
    }
    go(Math.min(step + 1, WALK_STEPS.length - 1));
  };
  return <StepsContext.Provider value={{ step, go, next, root }}>{children}</StepsContext.Provider>;
}

/** The drawer's footer: Cancel or Back, then Next, and Save on the last step. */
export function WalkStepsFooter({
  label,
  pending,
  pendingLabel,
}: {
  label: string;
  pending: boolean;
  pendingLabel: string;
}) {
  const steps = useContext(StepsContext);
  if (!steps || steps.step === WALK_STEPS.length - 1)
    return (
      <DrawerFormFooter
        cancelLabel={steps ? "Back" : undefined}
        label={label}
        onCancel={steps ? () => steps.go(steps.step - 1) : undefined}
        pending={pending}
        pendingLabel={pendingLabel}
      />
    );
  return (
    <DrawerFooter className="grid grid-cols-2 sm:flex sm:flex-row sm:justify-end">
      {steps.step === 0 ? (
        <DrawerClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DrawerClose>
      ) : (
        <Button onClick={() => steps.go(steps.step - 1)} type="button" variant="outline">
          Back
        </Button>
      )}
      <Button onClick={steps.next} type="button">
        Next
      </Button>
    </DrawerFooter>
  );
}

export function WalkFormFields({
  defaults,
  idPrefix,
  scheduleLocked = false,
}: {
  defaults?: WalkFormDefaults;
  idPrefix: string;
  scheduleLocked?: boolean;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const essentials = useWalkEssentials();

  // One step at a time in the drawer (Next and Back in its footer, see
  // WalkFormSteps). Every step stays in the form while hidden, so all of it
  // is sent with Save.
  const steps = useContext(StepsContext);
  const stepClass = (n: number) =>
    cn("flex flex-col gap-6", steps && steps.step !== n && "hidden");
  return (
    <div
      className="flex flex-col gap-6"
      // Enter in a box goes to the next step instead of saving early.
      onKeyDown={(event) => {
        if (!steps || steps.step >= WALK_STEPS.length - 1) return;
        const target = event.target as HTMLElement;
        if (event.key === "Enter" && target.tagName === "INPUT") {
          event.preventDefault();
          steps.next();
        }
      }}
      // Save with a required box empty on another step: open that step,
      // so the browser can point at the box.
      onInvalidCapture={(event) => {
        const panel = (event.target as HTMLElement).closest<HTMLElement>("[data-walk-step]");
        const n = Number(panel?.dataset.walkStep);
        if (steps && Number.isInteger(n) && n !== steps.step) steps.go(n);
      }}
      ref={steps?.root}
    >
      {steps ? (
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Step {steps.step + 1} of {WALK_STEPS.length} · {WALK_STEPS[steps.step]}
        </p>
      ) : null}
      <div className={stepClass(0)} data-walk-step="0">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={id("title")} required>
            Title
          </Label>
          <Input
            defaultValue={defaults?.title}
            id={id("title")}
            maxLength={120}
            minLength={3}
            name="title"
            placeholder="Burrs Country Park loop"
            required
          />
        </div>

        <FormSection title="When">
          <div className="flex flex-col gap-4">
            {/* One box under another in the drawer (not side by side). */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id("starts")} required>
                Date and start time
              </Label>
              <DateTimePicker
                defaultValue={
                  defaults ? utcToLondonWallClock(new Date(defaults.startsAt)) : undefined
                }
                disabled={scheduleLocked}
                disablePast={!scheduleLocked}
                id={id("starts")}
                name="startsAt"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id("duration")} required>
                Expected length
              </Label>
              {/* A walk saved at a length not in the list opens on Other length. */}
              <WalkLengthField
                defaultMins={defaults?.durationMins ?? 90}
                disabled={scheduleLocked}
                id={id("duration")}
              />
            </div>
          </div>
          {scheduleLocked ? (
            <FieldHint>
              The walk has started, so its date, time and length can&apos;t change. Missed someone?
              Add them on the walk page.
            </FieldHint>
          ) : null}
        </FormSection>
      </div>
      <div className={stepClass(1)} data-walk-step="1">
        <FormSection title="Where">
          <MeetingPointFields
            defaultLatitude={defaults?.latitude ?? null}
            defaultLocation={defaults?.location ?? ""}
            defaultLongitude={defaults?.longitude ?? null}
            defaultPostcode={defaults?.postcode ?? ""}
            defaultWhat3words={defaults?.what3words ?? ""}
            idPrefix={idPrefix}
          />
        </FormSection>
      </div>
      <div className={stepClass(2)} data-walk-step="2">
        <FormSection title="Details">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id("distance")}>Distance</Label>
              <Input
                defaultValue={defaults?.distance ?? ""}
                id={id("distance")}
                maxLength={60}
                name="distance"
                placeholder="8.8 km (5.5 miles)"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id("elevationGain")}>Elevation gain</Label>
              <Input
                defaultValue={defaults?.elevationGain ?? ""}
                id={id("elevationGain")}
                maxLength={60}
                name="elevationGain"
                placeholder="213 m"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id("grade")}>Grade</Label>
              <Select defaultValue={defaults?.grade ?? undefined} name="grade">
                <SelectTrigger id={id("grade")}>
                  <SelectValue placeholder="Not specified" />
                </SelectTrigger>
                <SelectContent>
                  {/* So a grade set by mistake can be taken off again. */}
                  <SelectItem value="">Not specified</SelectItem>
                  {WALK_GRADE_OPTIONS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id("walkLeader")} required>
                Walk leader
              </Label>
              <Input
                defaultValue={defaults?.walkLeader ?? ""}
                id={id("walkLeader")}
                maxLength={100}
                name="walkLeader"
                required
                placeholder="Glyn Beckwith"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id("backMarker")}>Back marker</Label>
              <Input
                defaultValue={defaults?.backMarker ?? ""}
                id={id("backMarker")}
                maxLength={100}
                name="backMarker"
                placeholder="TBA"
              />
              <FieldHint>Walks at the back of the group so nobody gets left behind.</FieldHint>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id("refreshmentStop")}>Refreshment stop</Label>
              <Input
                defaultValue={defaults?.refreshmentStop ?? ""}
                id={id("refreshmentStop")}
                maxLength={150}
                name="refreshmentStop"
                placeholder="Hare & Hounds, Bolton Road, Abbey Village"
              />
              <FieldHint>Where the walk stops for a drink or a bite. Leave blank if there isn&apos;t one.</FieldHint>
            </div>
          </div>
          <ExtraFactsField defaults={defaults?.extraFacts ?? []} />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Essentials</legend>
            <FieldHint>Tick what&apos;s there. Only ticked items show on the walk page.</FieldHint>
            {/* Each item is a whole tappable row with room to breathe, rather
                than a tick box squeezed beside wrapped text. */}
            <div className="grid gap-2">
              {essentials.map((item) => {
                const Icon = essentialIcon(item.icon);
                return (
                <Label
                  className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 font-normal transition-colors has-[[data-state=checked]]:border-foreground/40 has-[[data-state=checked]]:bg-muted/60"
                  htmlFor={id(`essential-${item.key}`)}
                  key={item.key}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{item.label}</span>
                  <Checkbox
                    defaultChecked={defaults?.essentials.includes(item.key) ?? false}
                    id={id(`essential-${item.key}`)}
                    name="essentials"
                    value={item.key}
                  />
                </Label>
                );
              })}
            </div>
          </fieldset>
        </FormSection>
      </div>
      <div className={stepClass(3)} data-walk-step="3">
        <FormSection title="Description">
          <WalkDescriptionField defaultValue={defaults?.description ?? ""} id={id("description")} />
        </FormSection>
      </div>
    </div>
  );
}
