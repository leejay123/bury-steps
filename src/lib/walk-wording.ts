/**
 * The words a walk page uses for where the walk is up to (the status line,
 * the countdown, and the walk's messages), editable in Settings → Site
 * wording → Walk page cards. Each can hold placeholders, filled in for the
 * walk: {opens}, {opensDay}, {start}, {finish}, {count}, {n}.
 * Only changed wording is saved; anything left blank uses the default.
 */
export const WALK_WORDING_DEFAULTS = {
  upcomingLabel: "Upcoming",
  upcomingLine: "Clock-in from {opens}",
  upcomingLineOtherDay: "Clock-in opens at {opens} on {opensDay}",
  openLabel: "Clock-in open",
  openLine: "Starts at {start}",
  liveLabel: "In progress",
  liveLine: "Finishes at {finish}",
  clockedIn: "{count} clocked in",
  finishedLabel: "Finished",
  finishedAttended: "{count} attended",
  finishedLine: "This walk has finished",
  cancelledLabel: "Cancelled",
  cancelledLine: "This walk isn't going ahead",
  countdownDays: "{n} days to go",
  countdownOneDay: "{n} day to go",
  countdownHours: "{n} hours to go",
  countdownMinutes: "{n} min to go",
  countdownLeft: "{n} min left",
  memberBefore: "Clock-in opens at {opens} on {opensDay}, an hour before the start.",
  memberMissed: "This walk has finished. Were you there? Ask an organiser to add you.",
  visitorFinished: "This walk has finished. The details are kept here to look back on.",
  organiserFinished:
    "Finished, so it can't be edited or cancelled. Missed a clock-in? Use Add someone under Attended.",
  cancelledTitle: "This walk has been cancelled",
  cancelledNext: "Check the walks list for the next one.",
} as const;

export type WalkWordingKey = keyof typeof WALK_WORDING_DEFAULTS;
export type WalkWording = Record<WalkWordingKey, string>;

export const MAX_WALK_WORDING = 200;

/** The settings page's groups: each line's name and when it shows. */
export const WALK_WORDING_GROUPS: {
  title: string;
  description: string;
  items: { key: WalkWordingKey; label: string; hint: string }[];
}[] = [
  {
    title: "Status line",
    description:
      "The first line of the Status band, and the status on every walk page layout. Its name and the rest are shown as “Name · rest”.",
    items: [
      { key: "upcomingLabel", label: "Upcoming: name", hint: "Until an hour before the start." },
      { key: "upcomingLine", label: "Upcoming: the rest", hint: "{opens} is when clock-in opens." },
      {
        key: "upcomingLineOtherDay",
        label: "Upcoming, when clock-in opens the day before",
        hint: "For a walk starting before 1am. {opens}, {opensDay}.",
      },
      { key: "openLabel", label: "Clock-in open: name", hint: "From an hour before until the start." },
      { key: "openLine", label: "Clock-in open: the rest", hint: "{start} is the start time." },
      { key: "liveLabel", label: "In progress: name", hint: "From the start until the finish." },
      { key: "liveLine", label: "In progress: the rest", hint: "{finish} is the finish time." },
      {
        key: "clockedIn",
        label: "How many clocked in",
        hint: "Added to Clock-in open and In progress when known. {count}.",
      },
      { key: "finishedLabel", label: "Finished: name", hint: "After the finish." },
      { key: "finishedAttended", label: "Finished: how many came", hint: "When known. {count}." },
      { key: "finishedLine", label: "Finished: when the number isn't known", hint: "" },
      { key: "cancelledLabel", label: "Cancelled: name", hint: "" },
      { key: "cancelledLine", label: "Cancelled: the rest", hint: "" },
    ],
  },
  {
    title: "Countdown",
    description:
      "Shown after the status when a design puts the countdown in the Status band, and in countdown blocks. {n} is the number.",
    items: [
      { key: "countdownDays", label: "More than a day away", hint: "{n} days." },
      { key: "countdownOneDay", label: "About a day away", hint: "Between 24 and 36 hours ({n} is 1)." },
      { key: "countdownHours", label: "2 hours to a day away", hint: "{n} hours." },
      { key: "countdownMinutes", label: "Under 2 hours away", hint: "{n} minutes." },
      { key: "countdownLeft", label: "While the walk is happening", hint: "{n} minutes left." },
    ],
  },
  {
    title: "Messages",
    description: "The walk's messages, shown to the people they're for while they apply.",
    items: [
      {
        key: "memberBefore",
        label: "Members, before clock-in opens",
        hint: "{opens}, {opensDay}.",
      },
      { key: "memberMissed", label: "Members who didn't clock in, after the walk", hint: "" },
      { key: "visitorFinished", label: "Signed-out visitors, after the walk", hint: "" },
      {
        key: "organiserFinished",
        label: "Organisers, after the walk",
        hint: "For organisers who can edit, cancel or manage attendance.",
      },
      { key: "cancelledTitle", label: "Cancelled: heading", hint: "For everyone." },
      {
        key: "cancelledNext",
        label: "Cancelled: what to do next",
        hint: "For members and visitors, after the reason (if one was given).",
      },
    ],
  },
];

/** Saved wording (only changed lines) over the defaults. */
export function parseWalkWording(raw: unknown): WalkWording {
  const out: WalkWording = { ...WALK_WORDING_DEFAULTS };
  if (!raw || typeof raw !== "object") return out;
  for (const key of Object.keys(WALK_WORDING_DEFAULTS) as WalkWordingKey[]) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) out[key] = value.trim().slice(0, MAX_WALK_WORDING);
  }
  return out;
}

/** Just the lines that differ from the defaults (what gets saved). */
export function changedWalkWording(raw: Record<string, unknown>): Partial<WalkWording> {
  const full = parseWalkWording(raw);
  const out: Partial<WalkWording> = {};
  for (const key of Object.keys(WALK_WORDING_DEFAULTS) as WalkWordingKey[]) {
    if (full[key] !== WALK_WORDING_DEFAULTS[key]) out[key] = full[key];
  }
  return out;
}

/** Fills in a line's placeholders ({count}, {opens}…); unknown ones are left as they are. */
export function fillWording(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole,
  );
}

/**
 * The countdown as a number and the words after it ("4" and "days to go"),
 * for looks that show the number big. A line whose number isn't at the
 * start comes back as words only.
 */
export function walkCountdown(
  wording: WalkWording,
  status: string,
  minsToStart: number,
  minsLeft: number,
): { value: string; unit: string } {
  const split = (template: string, n: number) => {
    const text = fillWording(template, { n });
    return template.trimStart().startsWith("{n}")
      ? { value: `${n}`, unit: text.slice(`${n}`.length).trim() }
      : { value: "", unit: text };
  };
  if (status === "in-progress") return split(wording.countdownLeft, minsLeft);
  if (status === "upcoming" || status === "starting-soon") {
    if (minsToStart > 1440) {
      const days = Math.round(minsToStart / 1440);
      return days === 1 ? split(wording.countdownOneDay, 1) : split(wording.countdownDays, days);
    }
    if (minsToStart > 120) return split(wording.countdownHours, Math.round(minsToStart / 60));
    return split(wording.countdownMinutes, minsToStart);
  }
  return status === "cancelled" ? { value: "—", unit: "cancelled" } : { value: "Done", unit: "finished" };
}
