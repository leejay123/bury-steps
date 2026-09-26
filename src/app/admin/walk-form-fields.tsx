"use client";

import { utcToLondonWallClock } from "@/lib/dates";
import { DateTimePicker } from "@/components/date-time-picker";
import { MeetingPointFields } from "@/components/meeting-point-fields";
import { FieldHint, FormSection } from "@/components/drawer-form";
import { WalkDescriptionField } from "./walk-description-field";
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

function walkLengthLabel(mins: number): string {
  return mins < 60 ? `${mins} minutes` : `${mins / 60} ${mins === 60 ? "hour" : "hours"}`;
}

export type WalkFormDefaults = {
  title: string;
  /** ISO string. */
  startsAt: string;
  durationMins: number;
  description: string | null;
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
        <WalkDescriptionField defaultValue={defaults?.description ?? ""} id={id("description")} />
      </FormSection>
    </div>
  );
}
