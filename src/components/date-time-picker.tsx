"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { combineLondonDateAndTime, LONDON, londonWallClockToUtc } from "@/lib/dates";

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));
const MONTH_NAMES = Array.from({ length: 12 }, (_, index) =>
  firstOf(2026, index).toLocaleString("en-GB", { month: "short" }),
);
const LAST_MONTH = new Date(2035, 11, 1, 12);

/** The 1st of a month, at midday (the calendar works in UK time: a midnight
 * here could be the day before in the UK). */
function firstOf(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1, 12);
}

/** A month as a number that orders (2026 Nov → 2026 * 12 + 10). */
function monthNumber(date: Date) {
  return date.getFullYear() * 12 + date.getMonth();
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
// A phone on its side (globals.css's `short`): too little height for the
// calendar to float under its button, so it opens in the form instead.
const SHORT_SCREEN = "(max-height: 500px) and (orientation: landscape)";

function subscribeShortScreen(onChange: () => void) {
  const query = window.matchMedia(SHORT_SCREEN);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readShortScreen() {
  return window.matchMedia(SHORT_SCREEN).matches;
}

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
  // The month on show, and whether the month-and-year grid is up instead
  // of the days. Picking the month here, in the calendar itself, instead
  // of a list popping up over the calendar: a list inside a pop-up inside
  // a drawer couldn't always scroll (a phone on its side).
  const [month, setMonth] = useState<Date>(() => {
    const from = initial?.date ?? new Date();
    return firstOf(from.getFullYear(), from.getMonth());
  });
  const [picking, setPicking] = useState(false);
  const short = useSyncExternalStore(subscribeShortScreen, readShortScreen, () => false);
  const inlinePanelRef = useRef<HTMLDivElement>(null);
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


  const openChange = (next: boolean) => {
    if (disabled) return;
    if (next) {
      // Opens on the chosen day's month (or this month), with its days.
      const from = date ?? todayLondon;
      setMonth(firstOf(from.getFullYear(), from.getMonth()));
      setPicking(false);
    }
    setOpen(next);
  };

  // Opened in the form (a phone on its side): bring the calendar into view
  // in the drawer's own scroller (scrollIntoView also pans the page, which
  // on iOS slides the drawer off the screen).
  const inlineOpen = short && open && !disabled;
  useEffect(() => {
    if (!inlineOpen) return;
    const frame = window.requestAnimationFrame(() => {
      const panel = inlinePanelRef.current;
      let scroller = panel?.parentElement ?? null;
      while (scroller) {
        const overflowY = window.getComputedStyle(scroller).overflowY;
        if (overflowY === "auto" || overflowY === "scroll") break;
        scroller = scroller.parentElement;
      }
      if (!panel || !scroller) return;
      const box = scroller.getBoundingClientRect();
      const rect = panel.getBoundingClientRect();
      // The button just above the calendar stays in sight.
      const button = triggerRef.current?.getBoundingClientRect();
      const top = button ? button.top : rect.top;
      if (rect.bottom > box.bottom - 8) {
        scroller.scrollTop += Math.min(rect.bottom - box.bottom + 8, top - box.top - 8);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [inlineOpen, picking]);

  const firstMonth = disablePast
    ? firstOf(todayLondon.getFullYear(), todayLondon.getMonth())
    : firstOf(2020, 0);
  const showMonth = (next: Date) => {
    const clamped = Math.min(Math.max(monthNumber(next), monthNumber(firstMonth)), monthNumber(LAST_MONTH));
    setMonth(firstOf(Math.floor(clamped / 12), clamped % 12));
  };
  const step = picking ? 12 : 1;
  const canGoBack = monthNumber(month) - (picking ? month.getMonth() : 0) > monthNumber(firstMonth);
  const canGoOn = monthNumber(month) + (picking ? 11 - month.getMonth() : 0) < monthNumber(LAST_MONTH);

  // ‹ November 2026 › — tap the name for the month-and-year grid.
  const header = (
    <div className="flex items-center justify-between gap-1">
      <Button
        aria-label={picking ? "Previous year" : "Previous month"}
        className="size-9"
        disabled={!canGoBack}
        onClick={() => showMonth(firstOf(month.getFullYear(), month.getMonth() - step))}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ChevronLeftIcon />
      </Button>
      <Button
        aria-expanded={picking}
        className="h-9 gap-1 px-3 font-medium"
        onClick={() => setPicking((open) => !open)}
        type="button"
        variant="ghost"
      >
        {picking
          ? month.getFullYear()
          : month.toLocaleString("en-GB", { month: "long", year: "numeric" })}
        <ChevronDownIcon className={picking ? "rotate-180" : undefined} />
      </Button>
      <Button
        aria-label={picking ? "Next year" : "Next month"}
        className="size-9"
        disabled={!canGoOn}
        onClick={() => showMonth(firstOf(month.getFullYear(), month.getMonth() + step))}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );

  // The twelve months of the year on show; picking one shows its days.
  const monthGrid = (
    <div className="grid grid-cols-3 gap-2 py-1">
      {MONTH_NAMES.map((name, index) => {
        const option = firstOf(month.getFullYear(), index);
        const outside =
          monthNumber(option) < monthNumber(firstMonth) || monthNumber(option) > monthNumber(LAST_MONTH);
        const current = index === month.getMonth();
        return (
          <Button
            aria-pressed={current}
            className="h-11"
            disabled={outside}
            key={name}
            onClick={() => {
              setMonth(option);
              setPicking(false);
            }}
            type="button"
            variant={current ? "default" : "outline"}
          >
            {name}
          </Button>
        );
      })}
    </div>
  );

  const panel = (
    <div className="flex flex-col gap-2">
      {header}
      {picking ? monthGrid : null}
      <Calendar
        captionLayout="label"
        // As wide as the date button, the days stretched across it, but
        // each a normal row's height (square days stretched far too tall).
        className={cn(
          "w-full p-0 [&_.rdp-day]:aspect-auto! [&_.rdp-day]:h-9! [&_.rdp-day_button]:aspect-auto! [&_.rdp-day_button]:h-9!",
          picking && "hidden",
        )}
        disabled={disablePast ? { before: todayLondon } : undefined}
        endMonth={new Date(2035, 11)}
        locale={enGB}
        // Our own header above shows the month (and picks it).
        classNames={{ month_caption: "hidden" }}
        hideNavigation
        mode="single"
        month={month}
        onMonthChange={showMonth}
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
        startMonth={firstMonth}
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
      // In the form (a phone on its side) it opens and folds away the
      // calendar under it; otherwise the pop-up does that.
      onClick={short ? () => openChange(!open) : undefined}
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
      {short ? (
        <>
          {trigger}
          {inlineOpen ? (
            <div className="rounded-md border p-3" ref={inlinePanelRef}>
              {panel}
            </div>
          ) : null}
        </>
      ) : (
        <Popover
          onOpenChange={openChange}
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
            // Radix focuses the month box as the pop-up opens, before it is in
            // place; Safari (iPad) then scrolled the calendar (and the drawer)
            // to it, cutting off the month row. Focus the pop-up itself once
            // it has settled, from the top.
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              const content = event.currentTarget as HTMLElement;
              window.requestAnimationFrame(() => {
                content.focus({ preventScroll: true });
                content.scrollTop = 0;
              });
            }}
            onInteractOutside={(event) => {
              if (isOwnNestedSelectLayer(event.target)) event.preventDefault();
            }}
          >
            {panel}
          </PopoverContent>
        </Popover>
      )}
      {time}
      {missing && !value ? (
        <p className="text-sm text-destructive" role="alert">
          Choose a date.
        </p>
      ) : null}
    </div>
  );
}
