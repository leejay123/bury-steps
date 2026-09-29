"use client";

import { utcToLondonWallClock } from "@/lib/dates";
import { DateTimePicker } from "@/components/date-time-picker";
import { MeetingPointFields } from "@/components/meeting-point-fields";
import { FieldHint, FormSection } from "@/components/drawer-form";
import { WALK_ESSENTIALS } from "@/lib/walk-essentials";
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("title")} required>
          Title
        </Label>
        <Input
          defaultValue={defaults?.title}
          id={id("title")}
          name="title"
          placeholder="Burrs Country Park loop"
          required
        />
      </div>

      <FormSection title="When">
        <div className="grid gap-4 sm:grid-cols-2">
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
            <Label htmlFor={id("duration")}>Expected length</Label>
            <Select
              defaultValue={String(defaults?.durationMins ?? 90)}
              disabled={scheduleLocked}
              name="durationMins"
            >
              <SelectTrigger id={id("duration")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WALK_LENGTH_OPTIONS.map((mins) => (
                  <SelectItem key={mins} value={String(mins)}>
                    {walkLengthLabel(mins)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {scheduleLocked ? (
          <FieldHint>
            The walk has started, so its date, time and length can&apos;t change. Missed someone?
            Add them on the walk page.
          </FieldHint>
        ) : null}
      </FormSection>

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

      <FormSection title="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id("distance")}>Distance</Label>
            <Input
              defaultValue={defaults?.distance ?? ""}
              id={id("distance")}
              name="distance"
              placeholder="8.8 km (5.5 miles)"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id("elevationGain")}>Elevation gain</Label>
            <Input
              defaultValue={defaults?.elevationGain ?? ""}
              id={id("elevationGain")}
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
                {WALK_GRADE_OPTIONS.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id("walkLeader")}>Walk leader</Label>
            <Input
              defaultValue={defaults?.walkLeader ?? ""}
              id={id("walkLeader")}
              name="walkLeader"
              placeholder="Glyn Beckwith"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id("backMarker")}>Back marker</Label>
            <Input
              defaultValue={defaults?.backMarker ?? ""}
              id={id("backMarker")}
              name="backMarker"
              placeholder="TBA"
            />
            <FieldHint>Walks at the back of the group so nobody gets left behind.</FieldHint>
          </div>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Essentials</legend>
          <FieldHint>Tick what&apos;s there. Only ticked items show on the walk page.</FieldHint>
          {/* Each item is a whole tappable row with room to breathe, rather
              than a tick box squeezed beside wrapped text. */}
          <div className="grid gap-2">
            {WALK_ESSENTIALS.map((item) => (
              <Label
                className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 font-normal transition-colors has-[[data-state=checked]]:border-foreground/40 has-[[data-state=checked]]:bg-muted/60"
                htmlFor={id(`essential-${item.key}`)}
                key={item.key}
              >
                <item.icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1">{item.label}</span>
                <Checkbox
                  defaultChecked={defaults?.essentials.includes(item.key) ?? false}
                  id={id(`essential-${item.key}`)}
                  name="essentials"
                  value={item.key}
                />
              </Label>
            ))}
          </div>
        </fieldset>
        <WalkDescriptionField defaultValue={defaults?.description ?? ""} id={id("description")} />
      </FormSection>
    </div>
  );
}
