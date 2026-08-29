"use client";

import { useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { enGB } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { combineLondonDateAndTime, LONDON, londonWallClockToUtc } from "@/lib/dates";

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

function parseWallClock(value?: string): { date: Date; hour: string; minute: string } | null {
  if (!value || value.length < 16) return null;
  const hour = value.slice(11, 13);
  const minute = value.slice(14, 16);
  if (!/^\d{2}$/.test(hour) || !/^\d{2}$/.test(minute)) return null;
  try {
    return { date: londonWallClockToUtc(`${value.slice(0, 10)}T12:00`), hour, minute };
  } catch {
    return null;
  }
}

// The Hour/Minute selects below are rendered inside this popover, but their
// dropdown content portals out to the document body — so, from Radix's point
// of view, clicking an hour/minute option is an "outside" interaction with
// this popover, and would otherwise close it. Only exempt *this component's
// own* nested selects (marked with `data-date-time-picker-select` below), not
// every select on the page: an unrelated field (e.g. a "linked walk" select
// elsewhere in the same form) must still be able to close this popover when
// opened, or the two floating panels end up open and overlapping at once.
function isOwnNestedSelectLayer(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("[data-date-time-picker-select]"));
}

export function DateTimePicker({
  defaultValue,
  disabled,
  id,
  name,
  required,
}: {
  defaultValue?: string;
  disabled?: boolean;
  id: string;
  name: string;
  required?: boolean;
}) {
  const initial = parseWallClock(defaultValue);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(initial?.date);
  const [hour, setHour] = useState(initial?.hour ?? "13");
  const [minute, setMinute] = useState(initial?.minute ?? "00");

  const minutes = useMemo(() => {
    if (MINUTES.includes(minute)) return MINUTES;
    return [...MINUTES, minute].sort();
  }, [minute]);

  const value = date ? combineLondonDateAndTime(date, Number(hour), Number(minute)) : "";
  const label = date
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: LONDON,
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(londonWallClockToUtc(value))
    : "Choose date and time";

  return (
    <div className="flex flex-col gap-2">
      {/*
        A `<Label htmlFor>` pointing at this component's `id` needs to land
        on something the user can actually focus and interact with. Give the
        visible trigger button the id so the label announces and activates
        it — this hidden input only exists to carry the value into the
        surrounding <form>, and was never meant to be what a screen reader
        lands on.
      */}
      <input
        aria-hidden={open ? undefined : true}
        className="sr-only"
        name={name}
        onChange={() => {}}
        required={required}
        tabIndex={-1}
        value={value}
      />
      <Popover
        onOpenChange={(next) => {
          if (disabled) return;
          setOpen(next);
        }}
        open={disabled ? false : open}
      >
        <PopoverTrigger asChild>
          <Button
            aria-expanded={open}
            className="w-full justify-start font-normal"
            disabled={disabled}
            id={id}
            type="button"
            variant="outline"
          >
            <CalendarIcon data-icon="inline-start" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto p-3"
          onFocusOutside={(event) => {
            if (isOwnNestedSelectLayer(event.target)) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (isOwnNestedSelectLayer(event.target)) event.preventDefault();
          }}
        >
          <div className="flex flex-col gap-3">
            <Calendar
              captionLayout="dropdown"
              className="p-0"
              endMonth={new Date(2035, 11)}
              locale={enGB}
              mode="single"
              onSelect={setDate}
              selected={date}
              startMonth={new Date(2020, 0)}
              timeZone={LONDON}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-hour`}>Hour</Label>
                <Select onValueChange={setHour} value={hour}>
                  <SelectTrigger id={`${id}-hour`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent data-date-time-picker-select="">
                    {HOURS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-minute`}>Minute</Label>
                <Select onValueChange={setMinute} value={minute}>
                  <SelectTrigger id={`${id}-minute`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent data-date-time-picker-select="">
                    {minutes.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">UK time.</p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
