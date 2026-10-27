"use client";

import { useMemo, useRef, useState } from "react";
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
  disablePast = false,
  id,
  name,
  required,
}: {
  defaultValue?: string;
  disabled?: boolean;
                  /** Block calendar days before today (UK), and earlier times today. */
  disablePast?: boolean;
  id: string;
  name: string;
  required?: boolean;
}) {
  const initial = parseWallClock(defaultValue);
  const [open, setOpen] = useState(false);
  const [missing, setMissing] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
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
      }).format(londonWallClockToUtc(value))
    : "Choose a date";

  const todayLondon = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: LONDON,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const year = Number(parts.find((part) => part.type === "year")?.value);
    const month = Number(parts.find((part) => part.type === "month")?.value);
    const day = Number(parts.find((part) => part.type === "day")?.value);
    return new Date(year, month - 1, day);
  }, []);

  const nowLondon = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: LONDON,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    return {
      hour: Number(parts.find((part) => part.type === "hour")?.value ?? 0),
      minute: Number(parts.find((part) => part.type === "minute")?.value ?? 0),
    };
  }, []);

  const isSelectedToday =
    Boolean(date) &&
    date!.getFullYear() === todayLondon.getFullYear() &&
    date!.getMonth() === todayLondon.getMonth() &&
    date!.getDate() === todayLondon.getDate();

  const hours = useMemo(() => {
    if (!disablePast || !isSelectedToday) return HOURS;
    return HOURS.filter((item) => Number(item) >= nowLondon.hour);
  }, [disablePast, isSelectedToday, nowLondon.hour]);

  const selectableMinutes = useMemo(() => {
    const base = minutes;
    if (!disablePast || !isSelectedToday || Number(hour) !== nowLondon.hour) return base;
    return base.filter((item) => Number(item) > nowLondon.minute);
  }, [disablePast, hour, isSelectedToday, minutes, nowLondon.hour, nowLondon.minute]);


  const panel = (
    <div className="flex flex-col gap-3">
      <Calendar
        captionLayout="dropdown"
        // As wide as the date button, the days stretched across it, but
        // each a normal row's height (square days stretched far too tall).
        className="w-full p-0 [&_.rdp-day]:aspect-auto! [&_.rdp-day]:h-9! [&_.rdp-day_button]:aspect-auto! [&_.rdp-day_button]:h-9!"
        disabled={disablePast ? { before: todayLondon } : undefined}
        endMonth={new Date(2035, 11)}
        locale={enGB}
        mode="single"
        onSelect={(next) => {
          setDate(next);
          // The day's picked: the calendar folds away (the time is below).
          if (next) setOpen(false);
          if (!disablePast || !next) return;
          const sameDay =
            next.getFullYear() === todayLondon.getFullYear() &&
            next.getMonth() === todayLondon.getMonth() &&
            next.getDate() === todayLondon.getDate();
          if (!sameDay) return;
          if (Number(hour) < nowLondon.hour) {
            setHour(String(nowLondon.hour).padStart(2, "0"));
            const nextMinute = MINUTES.find((item) => Number(item) > nowLondon.minute);
            if (nextMinute) setMinute(nextMinute);
          } else if (
            Number(hour) === nowLondon.hour &&
            Number(minute) <= nowLondon.minute
          ) {
            const nextMinute = MINUTES.find((item) => Number(item) > nowLondon.minute);
            if (nextMinute) setMinute(nextMinute);
            else {
              const nextHour = HOURS.find((item) => Number(item) > nowLondon.hour);
              if (nextHour) {
                setHour(nextHour);
                setMinute("00");
              }
            }
          }
        }}
        selected={date}
        startMonth={disablePast ? todayLondon : new Date(2020, 0)}
        timeZone={LONDON}
      />
    </div>
  );

  // The time: its own Hour and Minute boxes under the date (not in the
  // calendar's pop-up).
  const time = (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-hour`}>Hour</Label>
          <Select
            disabled={disabled}
            onValueChange={(next) => {
              setHour(next);
              if (
                disablePast &&
                isSelectedToday &&
                Number(next) === nowLondon.hour &&
                Number(minute) <= nowLondon.minute
              ) {
                const nextMinute = MINUTES.find((item) => Number(item) > nowLondon.minute);
                if (nextMinute) setMinute(nextMinute);
              }
            }}
            value={hours.includes(hour) ? hour : (hours[0] ?? hour)}
          >
            <SelectTrigger id={`${id}-hour`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent data-date-time-picker-select="">
              {hours.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-minute`}>Minute</Label>
          <Select
            disabled={disabled}
            onValueChange={setMinute}
            value={
              selectableMinutes.includes(minute)
                ? minute
                : (selectableMinutes[0] ?? minute)
            }
          >
            <SelectTrigger id={`${id}-minute`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent data-date-time-picker-select="">
              {selectableMinutes.map((item) => (
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
  );

  const trigger = (
    <Button
      aria-expanded={open}
      aria-invalid={missing && !value ? true : undefined}
      className="w-full justify-start font-normal"
      disabled={disabled}
      id={id}
      ref={triggerRef}
      type="button"
      variant="outline"
    >
      <CalendarIcon data-icon="inline-start" />
      {label}
    </Button>
  );

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
        // Left empty, the browser pinned its "Please fill out this field"
        // bubble to this invisible input. Say it under the button instead.
        onInvalid={(event) => {
          event.preventDefault();
          setMissing(true);
          triggerRef.current?.focus();
        }}
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
          {trigger}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          // As wide as the button; never taller than the room left on the
          // screen, scrolling inside if it must (a phone, or Android with
          // its keyboard up). data-vaul-no-drag: in a drawer, a finger
          // moving in here scrolls the calendar, not the drawer.
          className="max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) min-w-72 overflow-y-auto overscroll-contain p-3"
          data-vaul-no-drag=""
          onFocusOutside={(event) => {
            if (isOwnNestedSelectLayer(event.target)) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (isOwnNestedSelectLayer(event.target)) event.preventDefault();
          }}
        >
          {panel}
        </PopoverContent>
      </Popover>
      {time}
      {missing && !value ? (
        <p className="text-sm text-destructive" role="alert">
          Choose a date.
        </p>
      ) : null}
    </div>
  );
}
