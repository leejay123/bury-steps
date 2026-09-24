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
import { combineLondonDateAndTime, LONDON, londonWallClockToUtc, londonYmd } from "@/lib/dates";

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

/** Earliest 5-minute slot strictly after the current London minute, if any. */
function nextMinuteAfter(minute: number): string | undefined {
  return MINUTES.find((item) => Number(item) > minute);
}

/** Latest 5-minute slot at or before the current London minute, if any. */
function minuteAtOrBefore(minute: number): string | undefined {
  return [...MINUTES].reverse().find((item) => Number(item) <= minute);
}

/** Snap hour/minute forward so disablePast never leaves a past wall-clock in state.
 * Returns null when today has no remaining 5-minute slot — caller should roll to tomorrow. */
function snapPastTime(
  hour: string,
  minute: string,
  nowHour: number,
  nowMinute: number,
): { hour: string; minute: string } | null {
  const h = Number(hour);
  const m = Number(minute);
  if (h > nowHour || (h === nowHour && m > nowMinute)) {
    return { hour, minute };
  }
  const nextMinute = nextMinuteAfter(nowMinute);
  if (nextMinute) {
    return { hour: String(nowHour).padStart(2, "0"), minute: nextMinute };
  }
  const nextHour = HOURS.find((item) => Number(item) > nowHour);
  if (nextHour) return { hour: nextHour, minute: "00" };
  return null;
}

function londonTomorrowNoon(todayLondon: Date): Date {
  const { year, month, day } = londonYmd(todayLondon);
  const next = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0));
  return londonWallClockToUtc(
    `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}T12:00`,
  );
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Snap hour/minute back so disableFuture never leaves a future wall-clock in state. */
function snapFutureTime(
  hour: string,
  minute: string,
  nowHour: number,
  nowMinute: number,
): { hour: string; minute: string } {
  const h = Number(hour);
  const m = Number(minute);
  if (h < nowHour || (h === nowHour && m <= nowMinute)) {
    return { hour, minute };
  }
  const prevMinute = minuteAtOrBefore(nowMinute);
  if (prevMinute !== undefined) {
    return { hour: String(nowHour).padStart(2, "0"), minute: prevMinute };
  }
  if (nowHour > 0) {
    return { hour: String(nowHour - 1).padStart(2, "0"), minute: "55" };
  }
  return { hour: "00", minute: "00" };
}

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
  disableFuture = false,
  id,
  name,
  required,
}: {
  defaultValue?: string;
  disabled?: boolean;
  /** Block calendar days before today (UK), and earlier times today. */
  disablePast?: boolean;
  /** Block calendar days after today (UK), and later times today. */
  disableFuture?: boolean;
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

  const todayLondon = useMemo(() => {
    // Calendar uses timeZone={LONDON}; "today" must be that calendar day as a
    // real London wall-clock instant — not `new Date(y, m-1, d)` (browser-local
    // midnight), which can leave yesterday selectable when the organiser is
    // ahead of the UK.
    const { year, month, day } = londonYmd(new Date());
    return londonWallClockToUtc(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00`,
    );
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

  const isSelectedToday = Boolean(date) && (() => {
    const selected = londonYmd(date!);
    const today = londonYmd(todayLondon);
    return (
      selected.year === today.year &&
      selected.month === today.month &&
      selected.day === today.day
    );
  })();

  // Derive a non-past / non-future wall clock — do not sync via useEffect
  // (react-hooks/set-state-in-effect). After the last London 5-minute slot
  // of the day, disablePast rolls the value to tomorrow 00:00 so the form
  // never posts a past time with empty hour/minute lists.
  const {
    date: effectiveDate,
    hour: effectiveHour,
    minute: effectiveMinute,
  } = useMemo(() => {
    if (disablePast && date && isSelectedToday) {
      const snapped = snapPastTime(hour, minute, nowLondon.hour, nowLondon.minute);
      if (!snapped) {
        return { date: londonTomorrowNoon(todayLondon), hour: "00", minute: "00" };
      }
      return { date, hour: snapped.hour, minute: snapped.minute };
    }
    if (disableFuture && date && isSelectedToday) {
      const snapped = snapFutureTime(hour, minute, nowLondon.hour, nowLondon.minute);
      return { date, hour: snapped.hour, minute: snapped.minute };
    }
    return { date, hour, minute };
  }, [
    date,
    disableFuture,
    disablePast,
    hour,
    isSelectedToday,
    minute,
    nowLondon.hour,
    nowLondon.minute,
    todayLondon,
  ]);

  const isEffectiveToday = Boolean(effectiveDate) && (() => {
    const selected = londonYmd(effectiveDate!);
    const today = londonYmd(todayLondon);
    return (
      selected.year === today.year &&
      selected.month === today.month &&
      selected.day === today.day
    );
  })();

  const value = effectiveDate
    ? combineLondonDateAndTime(effectiveDate, Number(effectiveHour), Number(effectiveMinute))
    : "";
  const label = effectiveDate
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

  const hours = useMemo(() => {
    if (disablePast && isEffectiveToday) {
      const currentHourHasFutureMinute = Boolean(nextMinuteAfter(nowLondon.minute));
      return HOURS.filter((item) => {
        const value = Number(item);
        if (value > nowLondon.hour) return true;
        if (value === nowLondon.hour) return currentHourHasFutureMinute;
        return false;
      });
    }
    if (disableFuture && isEffectiveToday) {
      return HOURS.filter((item) => Number(item) <= nowLondon.hour);
    }
    return HOURS;
  }, [disableFuture, disablePast, isEffectiveToday, nowLondon.hour, nowLondon.minute]);

  const selectableMinutes = useMemo(() => {
    const base = minutes;
    if (!isEffectiveToday || Number(effectiveHour) !== nowLondon.hour) {
      return base;
    }
    if (disablePast) {
      return base.filter((item) => Number(item) > nowLondon.minute);
    }
    if (disableFuture) {
      return base.filter((item) => Number(item) <= nowLondon.minute);
    }
    return base;
  }, [
    disableFuture,
    disablePast,
    effectiveHour,
    isEffectiveToday,
    minutes,
    nowLondon.hour,
    nowLondon.minute,
  ]);

  const calendarDisabled = disablePast
    ? { before: todayLondon }
    : disableFuture
      ? { after: todayLondon }
      : undefined;

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
              disabled={calendarDisabled}
              endMonth={disableFuture ? todayLondon : new Date(2035, 11)}
              locale={enGB}
              mode="single"
              onSelect={(next) => {
                if (!next) {
                  setDate(undefined);
                  return;
                }
                const selected = londonYmd(next);
                const today = londonYmd(todayLondon);
                const sameDay =
                  selected.year === today.year &&
                  selected.month === today.month &&
                  selected.day === today.day;
                if (disablePast && sameDay) {
                  const snapped = snapPastTime(hour, minute, nowLondon.hour, nowLondon.minute);
                  if (!snapped) {
                    setDate(londonTomorrowNoon(todayLondon));
                    setHour("00");
                    setMinute("00");
                    return;
                  }
                  setDate(next);
                  setHour(snapped.hour);
                  setMinute(snapped.minute);
                  return;
                }
                setDate(next);
                if (disableFuture && sameDay) {
                  const snapped = snapFutureTime(hour, minute, nowLondon.hour, nowLondon.minute);
                  setHour(snapped.hour);
                  setMinute(snapped.minute);
                }
              }}
              selected={effectiveDate}
              startMonth={disablePast ? todayLondon : new Date(2020, 0)}
              timeZone={LONDON}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-hour`}>Hour</Label>
                <Select
                  onValueChange={(next) => {
                    if (
                      disablePast &&
                      isEffectiveToday &&
                      Number(next) === nowLondon.hour
                    ) {
                      const snapped = snapPastTime(next, minute, nowLondon.hour, nowLondon.minute);
                      if (!snapped) {
                        setDate(londonTomorrowNoon(todayLondon));
                        setHour("00");
                        setMinute("00");
                        return;
                      }
                      setHour(snapped.hour);
                      setMinute(snapped.minute);
                      return;
                    }
                    if (
                      disableFuture &&
                      isEffectiveToday &&
                      Number(next) === nowLondon.hour
                    ) {
                      const snapped = snapFutureTime(
                        next,
                        minute,
                        nowLondon.hour,
                        nowLondon.minute,
                      );
                      setHour(snapped.hour);
                      setMinute(snapped.minute);
                      return;
                    }
                    setHour(next);
                  }}
                  value={hours.includes(effectiveHour) ? effectiveHour : (hours[0] ?? effectiveHour)}
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
                  onValueChange={setMinute}
                  value={
                    selectableMinutes.includes(effectiveMinute)
                      ? effectiveMinute
                      : (selectableMinutes[0] ?? effectiveMinute)
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
        </PopoverContent>
      </Popover>
    </div>
  );
}
