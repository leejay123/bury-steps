"use client";

import {
  createUsePuck,
  type ComponentConfig,
  type Config,
} from "@puckeditor/core";
import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { PreviewAudience, WalkPartsProvider, useWalkParts } from "./parts";
import { ReadyLayoutBlock } from "./ready-layout-block";
import { READY_LAYOUTS } from "./ready-layouts";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  TabStyleProvider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { TabStyle } from "@/lib/tab-style";
import {
  ActionsBlock,
  AttendedBlock,
  BadgesBlock,
  BeforeBlock,
  BentoBlock,
  ColourBlocksBlock,
  HowItWorksBlock,
  PhasesBoardBlock,
  StoryCardsBlock,
  TicketBlock,
  ClockInBlock,
  DescriptionBlock,
  DetailsBlock,
  EssentialsBlock,
  FactsBlock,
  JourneyBlock,
  MapBlock,
  MessagesBlock,
  MobileSidebar,
  PeopleStackBlock,
  PreciseBlock,
  StatusBlock,
  SummaryTilesBlock,
  DEFAULT_SUMMARY_TILES,
  TitleBlock,
  WeatherBlock,
  BackLinkBlock,
  MessagesOrSample,
  CountdownBlock,
  DirectionsBlock,
  FactBlock,
  StatusBadgeBlock,
  TimelineBlock,
  WalkNameBlock,
  FACT_NAMES,
  BOX_LOOK,
  MESSAGE_LOOK,
  type BoxLook,
  type MessageLook,
  arrangesFor,
  keptFactsAs,
  titlePartsOf,
  type TitlePart,
  type Arrange,
  type FactsVariant,
  type StatusVariant,
} from "./blocks";

const yesNo = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];
const options = <T extends string>(pairs: [T, string][]) =>
  pairs.map(([value, label]) => ({ value, label }));

const factsOptions = options<FactsVariant>([
  ["grid", "Grid of icons and values"],
  ["pairs", "Two columns"],
  ["list", "Two-column list with lines"],
  ["table", "One-column table"],
  ["inline", "One line of icons"],
  ["chips", "Grey chips"],
  ["tiles", "Tiles"],
]);

const phoneFactsOptions = [
  { value: "same", label: "Same as on computers" },
  ...factsOptions,
];
const tabletFactsOptions = [
  { value: "same", label: "Same as on computers" },
  { value: "phone", label: "Same as on phones" },
  ...factsOptions,
];
const tabletArrangeField = {
  type: "radio" as const,
  label: "On tablets: arrange",
  options: [
    { value: "same", label: "Same as on computers" },
    { value: "phone", label: "Same as on phones" },
    { value: "fill", label: "Fill the width (no gaps)" },
    { value: "grid", label: "Even grid (columns line up)" },
    { value: "scroll", label: "One row, swipe sideways" },
    { value: "carousel", label: "Carousel with ‹ › buttons" },
  ],
};
const phoneArrangeField = {
  type: "radio" as const,
  label: "On phones: arrange",
  options: [
    { value: "same", label: "Same as on computers" },
    { value: "fill", label: "Fill the width (no gaps)" },
    { value: "grid", label: "Even grid (columns line up)" },
    { value: "scroll", label: "One row, swipe sideways" },
    { value: "carousel", label: "Carousel with ‹ › buttons" },
  ],
};
const messageLookField = {
  type: "select" as const,
  label: "Messages look",
  options: options<MessageLook>([
    ["as-is", "Plain grey band (like the status band)"],
    ["band-outline", "Plain band with an outline"],
    ["band-bar", "Grey band with a dark bar on the left"],
    ["band-line", "Plain, with a line underneath"],
    ["compact", "Compact"],
    ["boxes", "Coloured boxes (blue information, red cancelled)"],
    ["hidden", "Hide them"],
  ]),
};
const boxLookField = {
  type: "select" as const,
  label: "Boxes inside (panels, cards)",
  options: options<BoxLook>([
    ["as-is", "As designed"],
    ["flat", "Flat: no border, background or shadow"],
    ["tint", "Light grey, no border"],
    ["outline", "Outline only"],
  ]),
};

const BOXES = [
  { value: "none", label: "No box" },
  { value: "outline", label: "Outline" },
  { value: "card", label: "Card (border and shadow)" },
  { value: "grey", label: "Light grey" },
];
const boxField = (label: string) => ({
  type: "select" as const,
  label,
  options: BOXES,
});
const tabletBoxField = (label: string) => ({
  type: "select" as const,
  label,
  options: [
    { value: "same", label: "Same as on computers" },
    { value: "phone", label: "Same as on phones" },
    ...BOXES,
  ],
});
const phoneBoxField = (label: string) => ({
  type: "select" as const,
  label,
  options: [{ value: "same", label: "Same as on computers" }, ...BOXES],
});

const factLinesField = {
  type: "radio" as const,
  label: "Lines in the list (list and table looks)",
  options: [
    { value: "between", label: "Between rows only" },
    { value: "every", label: "Under every row" },
    { value: "none", label: "No lines" },
  ],
};

const factsGapField = {
  type: "select" as const,
  label: "Space between facts",
  options: [
    { value: "none", label: "None" },
    { value: "tight", label: "Tight" },
    { value: "closer", label: "Closer" },
    { value: "normal", label: "Normal" },
    { value: "more", label: "More" },
    { value: "lots", label: "Lots" },
  ],
};

const showEmptyField = {
  type: "radio" as const,
  label: "Empty facts",
  options: [
    { value: false, label: "Hide them" },
    { value: true, label: "Show “Not set” (organisers only)" },
  ],
};
const essentialsLooks = options([
  ["pills", "Outline pills"],
  ["chips", "Grey chips"],
  ["list", "List with icons"],
  ["ticks", "Tick list"],
  ["tiles", "Tiles"],
  ["inline", "One line of icons and words"],
  ["words", "Just the words, with dots between"],
  ["circles", "Icons in grey circles"],
  ["big-icons", "Big icons with words under"],
  ["cards", "Small outlined cards"],
  ["rows", "Rows with lines between"],
  ["segments", "One box split into sections"],
]);
const essentialsFields = {
  look: {
    type: "select" as const,
    label: "On computers: look",
    options: essentialsLooks,
  },
  arrange: {
    type: "radio" as const,
    label: "On computers: arrange",
    options: options([
      ["fill", "Fill the width (no gaps)"],
      ["grid", "Even grid (columns line up)"],
      ["scroll", "One row, swipe sideways"],
      ["carousel", "Carousel with ‹ › buttons"],
    ]),
  },
  tabletLook: {
    type: "select" as const,
    label: "On tablets: look",
    options: [
      { value: "same", label: "Same as on computers" },
      { value: "phone", label: "Same as on phones" },
      ...essentialsLooks,
    ],
  },
  tabletArrange: {
    type: "radio" as const,
    label: "On tablets: arrange",
    options: [
      { value: "same", label: "Same as on computers" },
      { value: "phone", label: "Same as on phones" },
      { value: "fill", label: "Fill the width (no gaps)" },
      { value: "grid", label: "Even grid (columns line up)" },
      { value: "scroll", label: "One row, swipe sideways" },
      { value: "carousel", label: "Carousel with ‹ › buttons" },
    ],
  },
  phoneLook: {
    type: "select" as const,
    label: "On phones: look",
    options: [
      { value: "same", label: "Same as on computers" },
      ...essentialsLooks,
    ],
  },
  phoneArrange: {
    type: "radio" as const,
    label: "On phones: arrange",
    options: [
      { value: "same", label: "Same as on computers" },
      { value: "fill", label: "Fill the width (no gaps)" },
      { value: "grid", label: "Even grid (columns line up)" },
      { value: "scroll", label: "One row, swipe sideways" },
      { value: "carousel", label: "Carousel with ‹ › buttons" },
    ],
  },
  box: boxField("On computers: box"),
  tabletBox: tabletBoxField("On tablets: box"),
  phoneBox: phoneBoxField("On phones: box"),
  heading: {
    type: "radio" as const,
    label: "“Essentials” heading",
    options: yesNo,
  },
  headingText: {
    type: "text" as const,
    label: "Heading words (blank: Essentials)",
  },
  showEmpty: {
    type: "radio" as const,
    label: "When none are ticked",
    options: [
      { value: false, label: "Show nothing" },
      { value: true, label: "Say “None ticked” (organisers only)" },
    ],
  },
};
const ESSENTIALS_DEFAULTS = {
  look: "pills",
  arrange: "scroll",
  tabletLook: "same",
  tabletArrange: "same",
  phoneLook: "same",
  phoneArrange: "same",
  box: "none",
  tabletBox: "same",
  phoneBox: "same",
  heading: true,
  headingText: "",
  showEmpty: false,
};
// The same words as Block layout's space above and below.
const spaceOptions = options([
  ["none", "None"],
  ["closer", "Closer"],
  ["normal", "Normal"],
  ["more", "More"],
  ["lots", "Lots"],
]);
// small / medium / large: designs saved before the words changed.
const GAP: Record<string, string> = {
  none: "gap-0",
  closer: "gap-3",
  normal: "gap-6",
  more: "gap-8",
  lots: "gap-12",
  small: "gap-3",
  medium: "gap-6",
  large: "gap-10",
};

// The day's timeline: its look and what goes in it.
const timelineLookField = {
  type: "select" as const,
  label: "Timeline look",
  options: options([
    ["bar", "Progress bar with the times under it"],
    ["cells", "Times in a box split into sections"],
    ["dots", "Dots on a line, start to finish"],
    ["line", "One line of times"],
    ["list", "List, one time per row"],
  ]),
};
const timelineItemFields = {
  timelineOpens: {
    type: "radio" as const,
    label: "Clock-in opens",
    options: yesNo,
  },
  timelineStart: { type: "radio" as const, label: "Set off", options: yesNo },
  timelineEnd: { type: "radio" as const, label: "Finish", options: yesNo },
};

const TITLE_PART_NAMES: Record<string, string> = {
  facts: "Facts",
  essentials: "Essentials",
  precise: "Precise location",
  timeline: "The day's timeline",
  description: "Description",
  map: "Map",
  clockin: "Your clock-in",
  countdown: "Countdown",
};

// Every design for the Details card's facts.
const FACTS_AS_OPTIONS: { value: string; label: string }[] = [
  { value: "facts", label: "Plain facts (pick the look below)" },
  {
    value: "card-table",
    label: "Card table (like the Walks and Members lists)",
  },
  { value: "colour-blocks", label: "Colour blocks" },
  {
    value: "bento",
    label: "Bento grid (has its own name and buttons)",
  },
  { value: "story-cards", label: "Story cards" },
  { value: "summary", label: "Summary tiles" },
  { value: "wide-tiles", label: "Wide tiles (icon beside, roomy)" },
  { value: "stat-cards", label: "Stat cards (big values)" },
  { value: "icon-circles", label: "Icons in coloured circles" },
  { value: "spec-sheet", label: "Spec sheet (striped table)" },
  { value: "sticky-notes", label: "Sticky notes" },
  { value: "journey", label: "Journey line (dots, swipe)" },
  { value: "top-bar", label: "Cards with a coloured top bar" },
  { value: "columns", label: "Columns with dividers" },
  { value: "big-pills", label: "Big pills (label and value)" },
  { value: "mini-cards", label: "Mini cards (compact)" },
  { value: "none", label: "Don't show facts" },
];
// On tablets and phones: all but the bento grid (it has its own name and buttons).
const DEVICE_FACTS_AS = FACTS_AS_OPTIONS.filter(
  (option) => option.value !== "bento",
);

// Every title look (the Title block and the Details card's title).
const TITLE_LOOKS: [string, string][] = [
  ["plain", "Plain"],
  ["chips", "With fact chips"],
  ["stats", "Big name and four key facts"],
  ["band", "Status band"],
];

/**
 * A heading between groups of settings (Puck's "custom" field: it shows
 * this instead of an input, and stores nothing).
 */
const usePuck = createUsePuck();

/** Reads the selected block's settings (for the fold headings' summaries). */
function useSelectedProps(): Record<string, unknown> {
  return (usePuck((s) => s.selectedItem?.props) ?? {}) as Record<
    string,
    unknown
  >;
}

/**
 * A Details card section heading that folds its settings away: click to
 * open (the others close, see FOLDS), with a one-line summary of what's
 * chosen when shut. Its stored value is just whether it's open.
 */
const foldSection = (
  title: string,
  note: string,
  summary: (props: Record<string, unknown>) => string,
) => ({
  type: "custom" as const,
  render: ({
    value,
    onChange,
  }: {
    value?: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <FoldHeading
      note={note}
      onToggle={() => onChange(!value)}
      open={Boolean(value)}
      summary={summary}
      title={title}
    />
  ),
});

function FoldHeading({
  title,
  note,
  open,
  onToggle,
  summary,
}: {
  title: string;
  note: string;
  open: boolean;
  onToggle: () => void;
  summary: (props: Record<string, unknown>) => string;
}) {
  const props = useSelectedProps();
  return (
    <button
      aria-expanded={open}
      // Plain: the designer already puts a line between settings, so no
      // border or rounding of its own (they doubled up and looked messy).
      className="flex w-full cursor-pointer items-center gap-2 text-left"
      onClick={onToggle}
      type="button"
    >
      {open ? (
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground"
        />
      ) : (
        <ChevronRight
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground"
        />
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium">{title}</span>
          {open ? null : (
            <span className="truncate text-xs text-muted-foreground">
              {summary(props)}
            </span>
          )}
        </span>
        {open ? (
          <span className="text-xs text-muted-foreground">{note}</span>
        ) : null}
      </span>
    </button>
  );
}

/** "More … options" inside an open section: shows the less-used settings. */
const moreToggle = (what: string) => ({
  type: "custom" as const,
  render: ({
    value,
    onChange,
  }: {
    value?: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <button
      aria-expanded={Boolean(value)}
      className="flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      onClick={() => onChange(!value)}
      type="button"
    >
      {value ? (
        <ChevronDown aria-hidden className="size-3.5" />
      ) : (
        <ChevronRight aria-hidden className="size-3.5" />
      )}
      {value ? `Fewer ${what} options` : `More ${what} options`}
    </button>
  ),
});

/** The Block layout heading, folded like the Details card's sections. */
const layoutSection = foldSection(
  "Block layout",
  "The block's frame, heading, spacing and which screens show it.",
  (p) => {
    const layout = (p.layout ?? {}) as Record<string, unknown>;
    return [
      said(
        layout.frame,
        {
          none: "No frame",
          card: "Card",
          tint: "Light grey",
          outline: "Outline",
        },
        "No frame",
      ),
      said(
        layout.showOn,
        {
          all: "Everywhere",
          phones: "Phones only",
          tablets: "Tablets only",
          computers: "Computers only",
          "phones-tablets": "Phones and tablets",
          "tablets-computers": "Tablets and computers",
        },
        "Everywhere",
      ),
    ].join(" · ");
  },
);

/** Shown as the summary: the chosen option's words, or "Off". */
const said = (value: unknown, words: Record<string, string>, fallback = "") =>
  words[String(value)] ?? (fallback || String(value ?? ""));

/**
 * The Details card's sections, in order: the heading, the main settings,
 * then (behind More … options) the less-used ones. Only one section is open
 * at a time (the Details block's resolveData).
 */
const FOLDS: {
  key: string;
  more: string;
  main: string[];
  extra: string[];
}[] = [
  {
    key: "_titleSection",
    more: "_titleMore",
    main: [
      "showTitle",
      "titleLook",
      "titleParts",
      "titleExtrasAt",
      "clockinLook",
      "countdownLook",
      "showActions",
    ],
    extra: [
      "bandStyle",
      "titleGap",
      "titleBox",
      "statusLook",
      "statusAt",
      "bigTitle",
      "titleMessages",
    ],
  },
  {
    key: "_mapSection",
    more: "_mapMore",
    main: ["map", "mapButtons", "mapHeight"],
    extra: ["mapButtonsLook", "mapCorners", "mapTitle", "mapNote"],
  },
  {
    key: "_preciseSection",
    more: "_preciseMore",
    main: ["preciseAt", "preciseLook"],
    extra: [],
  },
  {
    key: "_factsSection",
    more: "_factsMore",
    main: [
      "factsAs",
      "tabletFactsAs",
      "phoneFactsAs",
      "facts",
      "factsArrange",
      "tabletFacts",
      "tabletFactsArrange",
      "phoneFacts",
      "phoneFactsArrange",
    ],
    extra: [
      "factsBorder",
      "factLines",
      "showEmptyFacts",
      "factsGap",
      "factsTitle",
      "factsBox",
      "tabletFactsBox",
      "phoneFactsBox",
    ],
  },
  {
    key: "_timelineSection",
    more: "_timelineMore",
    main: ["timeline", "timelineLook"],
    extra: [
      "timelineOpens",
      "timelineStart",
      "timelineEnd",
      "timelineTitle",
      "timelineBox",
    ],
  },
  {
    key: "_essentialsSection",
    more: "_essentialsMore",
    main: ["showEssentials", "essentials"],
    extra: [],
  },
  {
    key: "_descriptionSection",
    more: "_descriptionMore",
    main: ["showDescription", "descriptionAt"],
    extra: ["descriptionTitle", "descriptionBox"],
  },
];

/**
 * Puts the Details card's settings in section order and folds away the
 * shut sections (and each open one's More options), after the settings
 * that can't apply have already been taken out.
 */
function foldDetailsFields<F extends Record<string, unknown>>(
  shown: F,
  props: Record<string, unknown>,
): F {
  const out: Record<string, unknown> = {};
  const placed = new Set<string>();
  for (const fold of FOLDS) {
    placed.add(fold.key).add(fold.more);
    [...fold.main, ...fold.extra].forEach((k) => placed.add(k));
    if (shown[fold.key]) out[fold.key] = shown[fold.key];
    if (!props[fold.key]) continue;
    for (const k of fold.main) if (k in shown) out[k] = shown[k];
    const extra = fold.extra.filter((k) => k in shown);
    if (extra.length === 0) continue;
    out[fold.more] =
      shown[fold.more] ??
      moreToggle(
        fold.key.replace(/^_|Section$/g, "").replace("precise", "location"),
      );
    if (props[fold.more]) for (const k of extra) out[k] = shown[k];
  }
  // Anything not in a section keeps its place at the end.
  for (const [k, v] of Object.entries(shown)) if (!placed.has(k)) out[k] = v;
  return out as F;
}

const section = (title: string, note: string) => ({
  type: "custom" as const,
  render: () => (
    <div className="-mx-1 mt-3 border-t pt-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  ),
});

/**
 * Each facts look offers only the arrangements it works with (a table can't
 * be cut into a swiping row); a look with none loses the setting.
 */
function limitArranges(
  shown: Record<string, unknown>,
  pairs: [key: string, look: string][],
) {
  for (const [key, look] of pairs) {
    const field = shown[key] as { options?: { value: string }[] } | undefined;
    if (!field?.options) continue;
    const ok: string[] = arrangesFor(look);
    if (ok.length === 0) {
      delete shown[key];
      continue;
    }
    shown[key] = {
      ...field,
      options: field.options.filter(
        (option) =>
          option.value === "same" ||
          option.value === "phone" ||
          ok.includes(option.value),
      ),
    };
  }
}

/** Keeps only the options of one setting that make sense right now. */
function keepOptions(
  shown: Record<string, unknown>,
  key: string,
  keep: (value: string) => boolean,
) {
  const field = shown[key] as { options?: { value: unknown }[] } | undefined;
  if (!field?.options) return;
  shown[key] = {
    ...field,
    options: field.options.filter((option) => keep(String(option.value))),
  };
}

/** Essentials looks where an even grid is the same as wrapping. */
const ESSENTIALS_NO_GRID = [
  "pills",
  "chips",
  "inline",
  "words",
  "rows",
  "list",
  "ticks",
];

/** Which device looks a phone and tablet end up with ("same", "phone"). */
function deviceLooks(computer: string, tablet: unknown, phone: unknown) {
  const phoneLook = !phone || phone === "same" ? computer : String(phone);
  const tabletLook =
    !tablet || tablet === "same"
      ? computer
      : tablet === "phone"
        ? phoneLook
        : String(tablet);
  return { tabletLook, phoneLook };
}

type DetailsProps = Record<string, unknown>;

/**
 * The facts design on each device (Facts shown as, then on tablets and
 * phones), and the look whose arrangements apply there: a plain facts
 * device uses its plain facts look.
 */
function factsOnDevices(props: DetailsProps) {
  const computer = keptFactsAs(props.factsAs);
  const phoneAs = keptFactsAs(props.phoneFactsAs ?? "same");
  const tabletAs = keptFactsAs(props.tabletFactsAs ?? "same");
  const phone = phoneAs === "same" ? computer : phoneAs;
  const tablet =
    tabletAs === "same" ? computer : tabletAs === "phone" ? phone : tabletAs;
  const plain = String(props.facts ?? "grid");
  const plainLooks = deviceLooks(plain, props.tabletFacts, props.phoneFacts);
  return {
    computer,
    tablet,
    phone,
    computerLook: computer === "facts" ? plain : computer,
    tabletLook: tablet === "facts" ? plainLooks.tabletLook : tablet,
    phoneLook: phone === "facts" ? plainLooks.phoneLook : phone,
    plainLooks: [
      computer === "facts" ? plain : null,
      tablet === "facts" ? plainLooks.tabletLook : null,
      phone === "facts" ? plainLooks.phoneLook : null,
    ].filter((look): look is string => look !== null),
  };
}
const LIST_LOOKS = ["list", "table"];

/**
 * The Details card's settings that can't apply to its current choices, so
 * they're hidden rather than offered (Puck's resolveFields): the map's
 * options with no map, the facts' device looks when the facts are shown
 * as a ticket or tiles, status options when the title is off or has its
 * own look, and so on. Nothing is lost: showing them again brings back
 * what was set.
 */
function hiddenDetailsSettings(props: DetailsProps): Set<string> {
  // The Card section (frame, space inside) is no longer offered; saved
  // designs keep what they had.
  // The Card and Ribbon sections are no longer offered.
  const hide = new Set<string>([
    "_cardSection",
    "tone",
    "inset",
    "_ribbonSection",
    "ribbon",
    "ribbonText",
    "ribbonStyle",
    "ribbonAt",
  ]);
  const factsAs = keptFactsAs(props.factsAs);
  const ownTitle = factsAs === "bento";
  // What's inside the title box: those parts' "where" settings don't apply.
  const parts =
    ownTitle || props.showTitle === false ? [] : titlePartsOf(props);
  const inTitle = (part: TitlePart) => parts.includes(part);
  if (ownTitle || props.showTitle === false) hide.add("titleParts");
  // Their looks and place only once they're in the title box list.
  if (!inTitle("clockin")) hide.add("clockinLook");
  if (!inTitle("countdown")) hide.add("countdownLook");
  if (!inTitle("clockin") && !inTitle("countdown")) hide.add("titleExtrasAt");
  // Ribbon
  if (!props.ribbon || props.ribbon === "none") {
    hide.add("ribbonText").add("ribbonStyle").add("ribbonAt");
  } else if (props.ribbon !== "text") hide.add("ribbonText");
  // Title (a ticket or bento grid brings its own name and buttons)
  if (ownTitle) {
    [
      "showTitle",
      "titleLook",
      "titleBox",
      "statusLook",
      "statusAt",
      "bigTitle",
      "showActions",
      "titleMessages",
      "bandStyle",
      "titleGap",
    ].forEach((k) => hide.add(k));
  } else {
    if (props.showTitle === false) {
      [
        "titleLook",
        "statusLook",
        "statusAt",
        "bigTitle",
        "bandStyle",
        "titleGap",
      ].forEach((k) => hide.add(k));
    }
    // The Status band has its own outline, so no box around it as well.
    if (String(props.titleLook ?? "").startsWith("band")) hide.add("titleBox");
    else hide.add("bandStyle");
    if ((props.titleLook ?? "standard") !== "standard") {
      ["statusLook", "statusAt", "bigTitle"].forEach((k) => hide.add(k));
    }
    if (props.statusLook === "none") hide.add("statusAt");
  }
  // Only the looks with a frame round them all have one to turn off.
  const framed = ["spec-sheet", "card-table"];
  if (
    ![props.factsAs, props.tabletFactsAs, props.phoneFactsAs].some((look) =>
      framed.includes(String(look)),
    )
  )
    hide.add("factsBorder");
  // Map
  if (inTitle("map")) hide.add("map");
  else if (!props.map || props.map === "none") {
    [
      "mapButtons",
      "mapButtonsLook",
      "mapHeight",
      "mapCorners",
      "mapTitle",
      "mapNote",
    ].forEach((k) => hide.add(k));
  } else if (props.mapButtons === "none") hide.add("mapButtonsLook");
  // Precise location
  if (inTitle("precise")) hide.add("preciseAt");
  else if (!props.preciseAt || props.preciseAt === "none")
    hide.add("preciseLook");
  // Facts: each device's settings only when that device shows facts, and
  // the plain look's settings only where the plain facts are used.
  const devices = factsOnDevices(props);
  if (factsAs === "bento") hide.add("tabletFactsAs").add("phoneFactsAs");
  const designs = [devices.computer, devices.tablet, devices.phone];
  if (designs.every((design) => design === "none"))
    ["showEmptyFacts", "factsGap", "factsTitle"].forEach((k) => hide.add(k));
  if (!designs.includes("facts")) hide.add("facts");
  if (devices.tablet !== "facts") hide.add("tabletFacts");
  if (devices.phone !== "facts") hide.add("phoneFacts");
  if (devices.computer === "none") hide.add("factsArrange").add("factsBox");
  if (devices.tablet === "none")
    hide.add("tabletFactsArrange").add("tabletFactsBox");
  if (devices.phone === "none")
    hide.add("phoneFactsArrange").add("phoneFactsBox");
  if (!devices.plainLooks.some((look) => LIST_LOOKS.includes(look)))
    hide.add("factLines");
  // Timeline
  // Inside the title box, the timeline is on and has no box of its own.
  if (inTitle("timeline")) hide.add("timeline").add("timelineBox");
  else if (!props.timeline)
    [
      "timelineTitle",
      "timelineBox",
      "timelineLook",
      ...Object.keys(timelineItemFields),
    ].forEach((k) => hide.add(k));
  // Essentials
  if (inTitle("essentials")) hide.add("showEssentials");
  else if (props.showEssentials === false) hide.add("essentials");
  // Description
  if (inTitle("description")) {
    hide.add("showDescription").add("descriptionAt").add("descriptionBox");
  } else if (props.showDescription === false) {
    hide.add("descriptionAt").add("descriptionTitle").add("descriptionBox");
  }
  return hide;
}

const directionsLookField = {
  type: "select" as const,
  label: "Directions buttons look",
  options: options([
    ["default", "Solid + outline"],
    ["outline", "Both outline"],
    ["solid", "Both solid"],
    ["ghost", "Ghost (no border)"],
    ["pills", "Rounded pills"],
    ["icons", "With map icons"],
    ["links", "Plain text links"],
    ["stacked", "Stacked, full width"],
  ]),
};

const cornersField = {
  type: "radio" as const,
  label: "Map corners",
  options: [
    { value: "square", label: "Square" },
    { value: "rounded", label: "Rounded" },
    { value: "very-rounded", label: "Very rounded" },
  ],
};

const preciseLookField = {
  type: "select" as const,
  label: "Precise location look",
  options: [
    { value: "card", label: "Full card (with its explanation)" },
    { value: "compact", label: "Compact one-line chip" },
    { value: "text", label: "Plain text link" },
  ],
};

const arrangeField = {
  type: "radio" as const,
  label: "Arrange",
  options: options<Arrange>([
    ["fill", "Fill the width (no gaps)"],
    ["grid", "Even grid (columns line up)"],
    ["scroll", "One row, swipe sideways"],
    ["carousel", "Carousel with ‹ › buttons"],
  ]),
};

/**
 * Options every block has, under "Block layout": a frame around it (or
 * none — nothing on a designed page runs edge to edge), a heading above
 * it, spacing, and whether it shows on phones, tablets or computers. Puck has no shared fields of its own, so they're added
 * to each block here (withBlockLayout).
 */
type BlockLayout = {
  frame?: "none" | "card" | "tint" | "dark" | "outline" | "green";
  heading?: string;
  showOn?:
    | "all"
    | "phones"
    | "tablets"
    | "computers"
    | "phones-tablets"
    | "tablets-computers";
  buttons?: "as-is" | "phones" | "always";
  shadows?: "keep" | "none";
  messages?: MessageLook;
  boxes?: BoxLook;
  spaceAbove?: "header" | "closer" | "normal" | "more" | "lots";
  spaceBelow?: "closer" | "normal" | "more" | "lots";
};
const BLOCK_LAYOUT: BlockLayout = {
  frame: "none",
  heading: "",
  showOn: "all",
  buttons: "as-is",
  shadows: "keep",
  messages: "as-is",
  boxes: "as-is",
  spaceAbove: "normal",
  spaceBelow: "normal",
};
const blockLayoutField = {
  type: "object" as const,
  label: "Frame, spacing and where it shows",
  objectFields: {
    frame: {
      type: "select" as const,
      label: "Frame",
      options: options([
        ["none", "None"],
        ["card", "Card"],
        ["tint", "Light grey"],
        ["outline", "Outline only"],
        ["green", "Green"],
      ]),
    },
    heading: { type: "text" as const, label: "Heading above (optional)" },
    buttons: {
      type: "select" as const,
      label: "Buttons",
      options: options([
        ["as-is", "As designed"],
        ["phones", "Full width on phones"],
        ["always", "Full width everywhere"],
      ]),
    },
    spaceAbove: {
      type: "select" as const,
      label: "Space above",
      options: options([
        ["header", "Right under the header (no space; for the first block)"],
        ["closer", "Closer to the block above"],
        ["normal", "Normal"],
        ["more", "More"],
        ["lots", "Lots"],
      ]),
    },
    spaceBelow: {
      type: "select" as const,
      label: "Space below",
      options: options([
        ["closer", "Closer to the block below"],
        ["normal", "Normal"],
        ["more", "More"],
        ["lots", "Lots"],
      ]),
    },
    messages: messageLookField,
    boxes: boxLookField,
    shadows: {
      type: "radio" as const,
      label: "Shadows",
      options: options([
        ["keep", "Keep"],
        ["none", "Remove"],
      ]),
    },
    showOn: {
      type: "radio" as const,
      label: "Show on",
      options: options([
        ["all", "Everywhere"],
        ["phones", "Phones only"],
        ["tablets", "Tablets only"],
        ["computers", "Computers only"],
        ["phones-tablets", "Phones and tablets"],
        ["tablets-computers", "Tablets and computers"],
      ]),
    },
  },
};

/**
 * Tab looks from free component libraries, recreated with our own styles
 * (nothing installed): Chakra UI's enclosed, enclosed-coloured,
 * soft-rounded and solid-rounded; Mantine's outline; HeroUI's bordered and
 * light; Origin UI's joined segments; plus an over-line and plain words.
 * They sit on the plain (grey pill) tabs, so the site's tab style doesn't
 * mix in.
 */
// Written out in full: Tailwind only makes the classes it finds whole in the code.
const TAB_LOOKS: Record<string, string> = {
  enclosed:
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:rounded-none [&_[data-slot=tabs-list]]:border-b [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-1 [&_[data-slot=tabs-trigger]]:-mb-px [&_[data-slot=tabs-trigger]]:rounded-b-none [&_[data-slot=tabs-trigger]]:rounded-t-lg [&_[data-slot=tabs-trigger]]:border [&_[data-slot=tabs-trigger]]:border-transparent [&_[data-slot=tabs-trigger]]:px-4 [&_[data-slot=tabs-trigger]]:py-2 [&_[data-slot=tabs-trigger][data-state=active]]:border-border [&_[data-slot=tabs-trigger][data-state=active]]:border-b-background [&_[data-slot=tabs-trigger][data-state=active]]:bg-background [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
  "enclosed-colour":
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:rounded-none [&_[data-slot=tabs-list]]:border-b [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-1 [&_[data-slot=tabs-trigger]]:-mb-px [&_[data-slot=tabs-trigger]]:rounded-b-none [&_[data-slot=tabs-trigger]]:rounded-t-lg [&_[data-slot=tabs-trigger]]:border [&_[data-slot=tabs-trigger]]:border-border [&_[data-slot=tabs-trigger]]:bg-muted [&_[data-slot=tabs-trigger]]:px-4 [&_[data-slot=tabs-trigger]]:py-2 [&_[data-slot=tabs-trigger][data-state=active]]:border-b-background [&_[data-slot=tabs-trigger][data-state=active]]:bg-background [&_[data-slot=tabs-trigger][data-state=active]]:text-emerald-700 [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
  "soft-rounded":
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-1 [&_[data-slot=tabs-trigger]]:rounded-full [&_[data-slot=tabs-trigger]]:px-4 [&_[data-slot=tabs-trigger]]:py-1.5 [&_[data-slot=tabs-trigger]]:text-muted-foreground [&_[data-slot=tabs-trigger][data-state=active]]:bg-emerald-100 [&_[data-slot=tabs-trigger][data-state=active]]:text-emerald-800 [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none dark:[&_[data-slot=tabs-trigger][data-state=active]]:bg-emerald-900 dark:[&_[data-slot=tabs-trigger][data-state=active]]:text-emerald-100",
  "solid-rounded":
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-1 [&_[data-slot=tabs-trigger]]:rounded-full [&_[data-slot=tabs-trigger]]:px-4 [&_[data-slot=tabs-trigger]]:py-1.5 [&_[data-slot=tabs-trigger][data-state=active]]:bg-primary [&_[data-slot=tabs-trigger][data-state=active]]:text-primary-foreground [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
  bordered:
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:rounded-xl [&_[data-slot=tabs-list]]:border-2 [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-1 [&_[data-slot=tabs-trigger]]:rounded-lg [&_[data-slot=tabs-trigger]]:py-1.5 [&_[data-slot=tabs-trigger][data-state=active]]:bg-foreground [&_[data-slot=tabs-trigger][data-state=active]]:text-background [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
  light:
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-1 [&_[data-slot=tabs-trigger]]:rounded-lg [&_[data-slot=tabs-trigger]]:px-3 [&_[data-slot=tabs-trigger]]:py-1.5 [&_[data-slot=tabs-trigger]]:text-muted-foreground [&_[data-slot=tabs-trigger][data-state=active]]:bg-muted [&_[data-slot=tabs-trigger][data-state=active]]:text-foreground [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
  "outline-pills":
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-2 [&_[data-slot=tabs-trigger]]:rounded-full [&_[data-slot=tabs-trigger]]:border [&_[data-slot=tabs-trigger]]:border-border [&_[data-slot=tabs-trigger]]:px-4 [&_[data-slot=tabs-trigger]]:py-1.5 [&_[data-slot=tabs-trigger][data-state=active]]:border-foreground [&_[data-slot=tabs-trigger][data-state=active]]:bg-foreground [&_[data-slot=tabs-trigger][data-state=active]]:text-background [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
  segments:
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:rounded-lg [&_[data-slot=tabs-list]]:border [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-0 [&_[data-slot=tabs-list]]:divide-x [&_[data-slot=tabs-list]]:overflow-hidden [&_[data-slot=tabs-trigger]]:rounded-none [&_[data-slot=tabs-trigger]]:px-4 [&_[data-slot=tabs-trigger]]:py-2 [&_[data-slot=tabs-trigger][data-state=active]]:bg-muted [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
  overline:
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:rounded-none [&_[data-slot=tabs-list]]:border-t [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-0 [&_[data-slot=tabs-trigger]]:-mt-px [&_[data-slot=tabs-trigger]]:rounded-none [&_[data-slot=tabs-trigger]]:border-0 [&_[data-slot=tabs-trigger]]:border-t-2 [&_[data-slot=tabs-trigger]]:border-transparent [&_[data-slot=tabs-trigger]]:px-4 [&_[data-slot=tabs-trigger]]:py-2.5 [&_[data-slot=tabs-trigger]]:text-muted-foreground [&_[data-slot=tabs-trigger][data-state=active]]:border-t-primary [&_[data-slot=tabs-trigger][data-state=active]]:text-foreground [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
  words:
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-5 [&_[data-slot=tabs-trigger]]:px-0 [&_[data-slot=tabs-trigger]]:text-muted-foreground [&_[data-slot=tabs-trigger][data-state=active]]:bg-transparent [&_[data-slot=tabs-trigger][data-state=active]]:font-semibold [&_[data-slot=tabs-trigger][data-state=active]]:text-foreground [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
  capsule:
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:rounded-full [&_[data-slot=tabs-list]]:p-1 [&_[data-slot=tabs-trigger]]:rounded-full [&_[data-slot=tabs-trigger]]:px-4 [&_[data-slot=tabs-trigger]]:py-1.5 [&_[data-slot=tabs-trigger][data-state=active]]:shadow-sm",
  "capsule-dark":
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:rounded-full [&_[data-slot=tabs-list]]:p-1 [&_[data-slot=tabs-trigger]]:rounded-full [&_[data-slot=tabs-trigger]]:px-4 [&_[data-slot=tabs-trigger]]:py-1.5 [&_[data-slot=tabs-trigger][data-state=active]]:bg-foreground [&_[data-slot=tabs-trigger][data-state=active]]:text-background [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
  floating:
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-2 [&_[data-slot=tabs-trigger]]:rounded-full [&_[data-slot=tabs-trigger]]:px-4 [&_[data-slot=tabs-trigger]]:py-2 [&_[data-slot=tabs-trigger]]:text-muted-foreground [&_[data-slot=tabs-trigger][data-state=active]]:bg-background [&_[data-slot=tabs-trigger][data-state=active]]:text-foreground [&_[data-slot=tabs-trigger][data-state=active]]:shadow-md",
  material:
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:rounded-none [&_[data-slot=tabs-list]]:border-b [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-0 [&_[data-slot=tabs-trigger]]:-mb-px [&_[data-slot=tabs-trigger]]:rounded-none [&_[data-slot=tabs-trigger]]:border-0 [&_[data-slot=tabs-trigger]]:border-b-[3px] [&_[data-slot=tabs-trigger]]:border-transparent [&_[data-slot=tabs-trigger]]:px-4 [&_[data-slot=tabs-trigger]]:py-3 [&_[data-slot=tabs-trigger]]:uppercase [&_[data-slot=tabs-trigger]]:tracking-wide [&_[data-slot=tabs-trigger]]:text-xs [&_[data-slot=tabs-trigger]]:text-muted-foreground [&_[data-slot=tabs-trigger][data-state=active]]:border-b-primary [&_[data-slot=tabs-trigger][data-state=active]]:text-foreground [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
  "green-underline":
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:rounded-none [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-4 [&_[data-slot=tabs-trigger]]:rounded-none [&_[data-slot=tabs-trigger]]:border-0 [&_[data-slot=tabs-trigger]]:border-b-2 [&_[data-slot=tabs-trigger]]:border-transparent [&_[data-slot=tabs-trigger]]:px-0 [&_[data-slot=tabs-trigger]]:pb-2 [&_[data-slot=tabs-trigger]]:text-muted-foreground [&_[data-slot=tabs-trigger][data-state=active]]:border-b-emerald-600 [&_[data-slot=tabs-trigger][data-state=active]]:text-emerald-700 [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none [&_[data-slot=tabs-trigger][data-state=active]]:bg-transparent",
  cards:
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-2 [&_[data-slot=tabs-trigger]]:rounded-xl [&_[data-slot=tabs-trigger]]:border [&_[data-slot=tabs-trigger]]:bg-card [&_[data-slot=tabs-trigger]]:px-4 [&_[data-slot=tabs-trigger]]:py-2.5 [&_[data-slot=tabs-trigger]]:shadow-sm [&_[data-slot=tabs-trigger][data-state=active]]:border-foreground [&_[data-slot=tabs-trigger][data-state=active]]:ring-1 [&_[data-slot=tabs-trigger][data-state=active]]:ring-foreground",
  "tinted-box":
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:rounded-xl [&_[data-slot=tabs-list]]:bg-emerald-50 [&_[data-slot=tabs-list]]:p-1 [&_[data-slot=tabs-trigger]]:rounded-lg [&_[data-slot=tabs-trigger]]:py-1.5 [&_[data-slot=tabs-trigger]]:text-emerald-900 [&_[data-slot=tabs-trigger][data-state=active]]:bg-emerald-600 [&_[data-slot=tabs-trigger][data-state=active]]:text-white [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
  "big-words":
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-6 [&_[data-slot=tabs-trigger]]:px-0 [&_[data-slot=tabs-trigger]]:text-lg [&_[data-slot=tabs-trigger]]:text-muted-foreground [&_[data-slot=tabs-trigger][data-state=active]]:bg-transparent [&_[data-slot=tabs-trigger][data-state=active]]:text-foreground [&_[data-slot=tabs-trigger][data-state=active]]:underline [&_[data-slot=tabs-trigger][data-state=active]]:decoration-2 [&_[data-slot=tabs-trigger][data-state=active]]:underline-offset-8 [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
  "square-blocks":
    "[&_[data-slot=tabs-list]]:h-auto [&_[data-slot=tabs-list]]:rounded-none [&_[data-slot=tabs-list]]:border [&_[data-slot=tabs-list]]:bg-transparent [&_[data-slot=tabs-list]]:p-0 [&_[data-slot=tabs-list]]:gap-0 [&_[data-slot=tabs-trigger]]:rounded-none [&_[data-slot=tabs-trigger]]:border-r [&_[data-slot=tabs-trigger]:last-child]:border-r-0 [&_[data-slot=tabs-trigger]]:px-4 [&_[data-slot=tabs-trigger]]:py-2.5 [&_[data-slot=tabs-trigger][data-state=active]]:bg-foreground [&_[data-slot=tabs-trigger][data-state=active]]:text-background [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none",
};

type TabItem = {
  label: string;
  content: (props: { className?: string }) => ReactNode;
};

/** A tab with nothing in it for this person (e.g. Attended, for a member). */
function isEmptyPanel(el: HTMLElement | null) {
  if (!el) return false;
  return (
    (el.textContent ?? "").trim() === "" &&
    !el.querySelector("img, iframe, video, canvas, input, button, a[href]")
  );
}

/**
 * The Tabs block. On the page, a tab whose blocks have nothing for whoever
 * is looking (Attended for a member, organiser tools for a visitor…) is
 * left out of the bar, checked once its content is on the page.
 */
function TabsView({
  list,
  editing,
  sticky,
  corners,
  fit,
  contentSpace = "normal",
  innerSpace = "normal",
  look = "style",
  side = false,
  emptyTabs = "hide",
}: {
  /** A tab with nothing in it: left out, or kept with a short note. */
  emptyTabs?: "hide" | "note";
  look?: string;
  side?: boolean;
  list: TabItem[];
  editing: boolean;
  sticky?: boolean;
  corners?: string;
  fit?: string;
  contentSpace?: string;
  innerSpace?: string;
}) {
  // Between the tab bar and the content (it had 16px), and between blocks in a tab.
  const below =
    (
      {
        none: "mt-0",
        closer: "mt-3",
        normal: "mt-6",
        more: "mt-6",
        lots: "mt-10",
        small: "mt-6",
        medium: "mt-6",
        large: "mt-10",
      } as Record<string, string>
    )[contentSpace] ?? "mt-6";
  const inner = GAP[innerSpace] ?? "gap-6";
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const [empty, setEmpty] = useState<boolean[]>([]);
  const [value, setValue] = useState("tab-0");
  const count = list.length;

  useEffect(() => {
    if (editing) return;
    const check = () => {
      const next = Array.from({ length: count }, (_, i) =>
        isEmptyPanel(panels.current[i] ?? null),
      );
      setEmpty((prev) =>
        prev.length === next.length && prev.every((v, i) => v === next[i])
          ? prev
          : next,
      );
    };
    check();
    const observer = new MutationObserver(check);
    for (const el of panels.current) {
      if (el)
        observer.observe(el, {
          childList: true,
          subtree: true,
          characterData: true,
        });
    }
    return () => observer.disconnect();
  }, [editing, count]);

  if (count === 0) return null;
  const shown = list
    .map((tab, i) => ({ tab, i }))
    .filter(({ i }) => editing || emptyTabs === "note" || !empty[i]);
  if (shown.length === 0) return null;
  const active = shown.some(({ i }) => `tab-${i}` === value)
    ? value
    : `tab-${shown[0].i}`;

  return (
    <Tabs
      className={cn(
        // Side tabs (computers): the names down the left, the content beside them.
        side &&
          "lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-x-6 [&>[data-slot=tabs-content]]:lg:col-start-2 [&>[data-slot=tabs-content]]:lg:row-start-1 [&>[data-slot=tabs-content]]:lg:mt-0",
      )}
      onValueChange={setValue}
      value={active}
    >
      {/* Full width; on a phone the names scroll sideways rather than squashing. */}
      <div
        className={cn(
          sticky &&
            "sticky top-16 z-20 -mx-1 bg-background/95 px-1 py-2 backdrop-blur-sm",
          TAB_LOOKS[look],
          // After the look, and forced, so the corners always win over the
          // look's own (they used to lose, so the setting seemed to do nothing).
          corners === "square" &&
            "[&_[data-slot=tabs-list]]:rounded-none! [&_[data-slot=tabs-trigger]]:rounded-none!",
          corners === "rounded" &&
            "[&_[data-slot=tabs-list]]:rounded-[8px]! [&_[data-slot=tabs-trigger]]:rounded-[8px]!",
          corners === "pill" &&
            "[&_[data-slot=tabs-list]]:rounded-full! [&_[data-slot=tabs-trigger]]:rounded-full!",
          side &&
            "lg:col-start-1 lg:row-start-1 lg:[&_[data-slot=tabs-list]]:w-full lg:[&_[data-slot=tabs-list]]:flex-col lg:[&_[data-slot=tabs-list]]:items-stretch lg:[&_[data-slot=tabs-trigger]]:justify-start",
        )}
      >
        <TabsList
          className={cn(
            "max-w-full justify-start overflow-x-auto [scrollbar-width:none] [&>*]:flex-none",
            // Share the width on every screen: two tabs on a phone fill it;
            // too many to fit keep their own width and the row scrolls.
            fit === "fill" && "w-full [&>*]:min-w-max [&>*]:flex-1",
            fit === "centre" && "mx-auto flex w-fit",
          )}
        >
          {shown.map(({ tab, i }) => (
            <TabsTrigger key={i} value={`tab-${i}`}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {list.map((tab, i) => {
        const Content = tab.content;
        return editing ? (
          <div
            className={cn(
              "flex flex-col gap-2 rounded-xl border border-dashed p-3",
              below,
            )}
            key={i}
          >
            <span className="text-xs font-medium text-muted-foreground">
              Tab {i + 1}: {tab.label} (drop its blocks here)
            </span>
            <Content className={cn("flex min-h-16 flex-col", inner)} />
          </div>
        ) : (
          // Kept on the page (hidden) so an empty tab can be spotted.
          <TabsContent
            className={cn("data-[state=inactive]:hidden", below)}
            forceMount
            key={i}
            value={`tab-${i}`}
          >
            {/* The blocks, watched to spot an empty tab (the note sits
                outside it, or it would never look empty). */}
            <div
              className="contents"
              ref={(el: HTMLDivElement | null) => {
                panels.current[i] = el;
              }}
            >
              <Content className={cn("flex flex-col", inner)} />
            </div>
            {emptyTabs === "note" && empty[i] ? (
              <p className="text-sm text-muted-foreground">
                Nothing to show here for this walk right now.
              </p>
            ) : null}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

/** The page; in the designer's preview it's marked with the audience being designed for (globals.css). */
type MessagesAt = "top" | "strip" | "block";

function PageRoot({
  children,
  editing = false,
  messagesLook = "as-is",
  messagesAt = "block",
}: {
  children: ReactNode;
  editing?: boolean;
  /** The messages' look (Page settings, nothing selected). */
  messagesLook?: MessageLook;
  /**
   * Where the walk's messages go (Page settings): "top", at the top of the
   * page at page width like any block ("strip", the old full-width strip,
   * was taken out and now shows the same); "block", wherever the Messages
   * block is placed.
   */
  messagesAt?: MessagesAt;
}) {
  const audience = useContext(PreviewAudience);
  const p = useWalkParts();
  const atTop = messagesAt !== "block";
  const messages =
    p && atTop ? (
      <MessagesOrSample
        className={MESSAGE_LOOK[messagesLook]}
        editing={editing}
        p={p}
      />
    ) : (
      // Keeps the blocks' box the last child (it gets the 24px gaps).
      <div hidden />
    );
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        // Puck wraps the page's blocks in one more box (its last child here,
        // after the messages); the 24px between blocks goes on that, or
        // blocks sit touching and "Closer" pulls one over another.
        "[&>:last-child]:flex [&>:last-child]:flex-col [&>:last-child]:gap-6",
        // The real page puts its own space around the design (16px on a
        // phone, 24px on a computer); the designer's preview has no page
        // around it, so it adds the same space to look the same.
        editing && "px-4 py-6 md:px-6",
      )}
      data-preview-audience={audience ?? undefined}
    >
      {messages}
      {p ? (
        // At the top (or in the strip), the blocks have no messages of
        // their own, so nothing shows twice.
        <WalkPartsProvider
          parts={
            atTop
              ? { ...p, notices: null, noticesInStrip: true }
              : { ...p, noticesInStrip: false }
          }
        >
          {children}
        </WalkPartsProvider>
      ) : (
        children
      )}
    </div>
  );
}

function BlockFrame({
  children,
  layout,
  audience,
  editing = false,
}: {
  children: ReactNode;
  layout?: BlockLayout;
  /** A block for one audience only: hidden whole for everyone else (it used
   * to leave its empty slot, and a double gap, behind). */
  audience?: "visitors" | "members";
  /** In the designer: never hidden, so every block can still be clicked. */
  editing?: boolean;
}) {
  const {
    frame,
    heading,
    showOn,
    buttons,
    shadows,
    messages,
    boxes,
    spaceAbove,
    spaceBelow,
  } = {
    ...BLOCK_LAYOUT,
    ...layout,
  };
  const framed = frame !== "none";
  return (
    <div
      data-guest-home={!editing && audience === "visitors" ? "" : undefined}
      data-member-home={!editing && audience === "members" ? "" : undefined}
      className={cn(
        "flex flex-col",
        // A block that shows nothing takes no room (no gap left behind).
        !editing && "has-[>div:empty]:hidden",
        // Blocks sit 24px apart; these pull a block closer or push it away.
        // The page starts 24px under the header; this cancels it.
        spaceAbove === "header" && "-mt-6",
        spaceAbove === "closer" && "-mt-3",
        spaceAbove === "more" && "mt-4",
        spaceAbove === "lots" && "mt-12",
        spaceBelow === "closer" && "-mb-3",
        spaceBelow === "more" && "mb-4",
        spaceBelow === "lots" && "mb-12",
        // Grow, never shrink: "flex-1" (a zero starting size) squashed a
        // button standing alone in a column, like Journey's Add event.
        buttons === "phones" &&
          "max-sm:[&_[data-slot=button]]:w-full max-sm:[&_[data-slot=button]]:grow",
        buttons === "always" &&
          "[&_[data-slot=button]]:w-full [&_[data-slot=button]]:grow",
        // Every shadow inside, except a part box chosen on purpose (Card).
        shadows === "none" && "[&_*:not([data-part-box])]:shadow-none",
        MESSAGE_LOOK[messages ?? "as-is"],
        BOX_LOOK[boxes ?? "as-is"],
        // Phones: under 768px; tablets: 768–1023px; computers: 1024px and wider.
        showOn === "phones" && "md:hidden",
        showOn === "tablets" && "max-md:hidden lg:hidden",
        showOn === "computers" && "max-lg:hidden",
        showOn === "phones-tablets" && "lg:hidden",
        showOn === "tablets-computers" && "max-md:hidden",
      )}
    >
      <div
        className={cn(
          // Fills the block when a column stretches it (equal heights).
          "flex min-w-0 flex-1 flex-col gap-3 [&>*:last-child]:grow",
          // The same 24px everywhere on the page.
          framed && "rounded-2xl p-6",
          frame === "card" && "border bg-card shadow-sm",
          frame === "tint" && "bg-muted/50",
          frame === "outline" && "border",
          frame === "dark" && "bg-neutral-950 text-white",
          frame === "green" && "bg-emerald-900 text-emerald-50",
        )}
      >
        {heading ? <h2 className="text-lg font-semibold">{heading}</h2> : null}
        {children}
      </div>
    </div>
  );
}

/** Adds "Block layout" to every block (except Section and Space, which have their own). */
function withBlockLayout(
  components: Config["components"],
): Config["components"] {
  return Object.fromEntries(
    Object.entries(components).map(([name, component]) => {
      if (name === "Section" || name === "Spacer") return [name, component];
      const Inner = component.render as (
        props: Record<string, unknown>,
      ) => ReactNode;
      const ownFields = component.resolveFields;
      const ownData = component.resolveData;
      const wrapped: ComponentConfig = {
        ...component,
        fields: {
          ...component.fields,
          _layoutSection: layoutSection,
          layout: blockLayoutField,
        },
        // Block layout folds away like the Details card's sections: shut,
        // only its heading (with a summary) shows, at the end.
        resolveFields: async (data, params) => {
          const base = (
            ownFields ? await ownFields(data, params) : params.fields
          ) as Record<string, unknown>;
          const { _layoutSection: heading, layout, ...rest } = base;
          const out: Record<string, unknown> = {
            ...rest,
            _layoutSection: heading ?? layoutSection,
          };
          if (data.props?._layoutSection)
            out.layout = layout ?? blockLayoutField;
          return out as typeof params.fields;
        },
        // One section open at a time: opening Block layout shuts the
        // block's other sections (the Details card's), and the other way round.
        resolveData: async (data, params) => {
          const resolved = ownData ? await ownData(data, params) : data;
          const props: Record<string, unknown> = { ...resolved.props };
          const changed = params.changed as Record<string, boolean | undefined>;
          if (changed._layoutSection && props._layoutSection) {
            for (const fold of FOLDS)
              if (fold.key in props) props[fold.key] = false;
          } else if (
            FOLDS.some((fold) => changed[fold.key] && props[fold.key])
          ) {
            props._layoutSection = false;
          }
          return { ...resolved, props: props as typeof resolved.props };
        },
        defaultProps: { ...component.defaultProps, layout: BLOCK_LAYOUT },
        render: (props: Record<string, unknown>) => (
          <BlockFrame
            audience={
              name === "HowItWorks" &&
              (props.showTo ?? "visitors") !== "everyone"
                ? ((props.showTo as "visitors" | "members" | undefined) ??
                  "visitors")
                : undefined
            }
            editing={Boolean(
              (props.puck as { isEditing?: boolean } | undefined)?.isEditing,
            )}
            layout={props.layout as BlockLayout | undefined}
          >
            <Inner {...props} />
          </BlockFrame>
        ),
      };
      return [name, wrapped];
    }),
  );
}

/**
 * Every block in the walk page designer (Puck), in the editor's left list:
 * the walk's parts — each with the looks from the 80 walk page designs as
 * variants — and layout blocks to arrange them (sections, columns, sidebars,
 * cards, tabs, folding sections). Nothing here fetches data: the walk page
 * hands the walk to every block (WalkPartsProvider).
 */
export const walkDesignConfig: Config = {
  categories: {
    walk: {
      title: "The walk",
      components: [
        "ReadyLayout",
        "BackLink",
        "Messages",
        "Title",
        "WalkName",
        "StatusBadge",
        "Countdown",
        "Timeline",
        "Fact",
        "Details",
        "Facts",
        "Essentials",
        "Description",
        "Actions",
        "ClockInButton",
        "ManageButton",
        "Status",
        "ClockIn",
        "HowItWorks",
        "PeopleStack",
        "SummaryTiles",
        "StoryCards",
        "Bento",
        "Ticket",
        "ColourBlocks",
        "Badges",
      ],
    },
    places: {
      title: "Map and weather",
      components: ["Map", "Directions", "Weather", "Precise", "Before"],
    },
    people: {
      title: "People and journey",
      components: ["Attended", "Journey", "PhasesBoard"],
    },
    layout: {
      title: "Layout",
      components: [
        "Section",
        "Columns",
        "Sidebar",
        "Card",
        "Tabs",
        "Folding",
        "Spacer",
        "Divider",
        "Heading",
        "Text",
      ],
    },
  },
  components: withBlockLayout({
    ReadyLayout: {
      label: "Ready-made layout (designs 1–81)",
      fields: {
        layout: {
          type: "select",
          label: "Design",
          options: READY_LAYOUTS.map((item) => ({
            value: item.id,
            label: `${item.number} · ${item.label}`,
          })),
        },
      },
      defaultProps: { layout: "s01" },
      render: ({ layout }) => <ReadyLayoutBlock layout={layout} />,
    },
    BackLink: {
      label: "Back link (← All walks)",
      fields: {
        label: {
          type: "text",
          label: "Words (blank: All walks / Walks / Home)",
        },
        look: {
          type: "select",
          label: "Look",
          options: options([
            ["text", "Plain text link"],
            ["outline", "Outline button"],
            ["ghost", "Ghost button"],
            ["solid", "Solid button"],
            ["pill", "Grey pill"],
            ["icon", "Round arrow button only"],
          ]),
        },
        arrow: {
          type: "radio",
          label: "Arrow",
          options: options([
            ["arrow", "Arrow ←"],
            ["chevron", "Chevron ‹"],
            ["none", "None"],
          ]),
        },
        align: {
          type: "radio",
          label: "Position",
          options: options([
            ["start", "Left"],
            ["centre", "Centre"],
            ["end", "Right"],
            ["full", "Full width"],
          ]),
        },
      },
      defaultProps: { label: "", look: "text", arrow: "arrow", align: "start" },
      render: ({ label, look, arrow, align }) => (
        <BackLinkBlock align={align} arrow={arrow} label={label} look={look} />
      ),
    },
    Messages: {
      label: "Messages",
      fields: { look: { ...messageLookField, label: "Look" } },
      defaultProps: { look: "as-is" },
      render: ({ look, puck }) => (
        <MessagesBlock editing={Boolean(puck?.isEditing)} look={look} />
      ),
    },
    Title: {
      label: "Title",
      fields: {
        variant: {
          type: "select",
          label: "Look",
          options: TITLE_LOOKS.map(([value, label]) => ({ value, label })),
        },
        actions: {
          type: "radio",
          label: "Clock in + Manage beside it",
          options: yesNo,
        },
      },
      defaultProps: { variant: "plain", actions: true },
      render: ({ variant, actions }) => (
        <TitleBlock actions={actions} variant={variant} />
      ),
    },
    Details: {
      label: "Details card",
      // Pages saved before the title box list: fill it from their old
      // settings, so the list shows what's already in the title box.
      // Opening one section of settings shuts the others.
      resolveData: (data, { changed }) => {
        const props: Record<string, unknown> = { ...data.props };
        if (!Array.isArray(props.titleParts))
          props.titleParts = titlePartsOf(props).map((part) => ({ part }));
        const opened = FOLDS.find(
          (fold) =>
            (changed as Record<string, boolean | undefined>)[fold.key] &&
            props[fold.key],
        );
        if (opened)
          for (const fold of FOLDS)
            if (fold !== opened) props[fold.key] = false;
        return { ...data, props: props as typeof data.props };
      },
      // Only the settings that apply to what's chosen (hiddenDetailsSettings).
      resolveFields: (data, { fields }) => {
        const props = data.props as DetailsProps;
        const hide = hiddenDetailsSettings(props);
        const shown = Object.fromEntries(
          Object.entries(fields).filter(([key]) => !hide.has(key)),
        ) as typeof fields;
        // Each facts look offers only the arrangements it works with (a
        // table can't be cut into a swiping row); none: the setting goes.
        const { computerLook, tabletLook, phoneLook } = factsOnDevices(props);
        limitArranges(shown, [
          ["factsArrange", computerLook],
          ["tabletFactsArrange", tabletLook],
          ["phoneFactsArrange", phoneLook],
        ]);
        // Only the choices that apply to what's picked elsewhere.
        const band = String(props.titleLook ?? "").startsWith("band");
        keepOptions(shown, "titleMessages", (v) => v !== "in-band" || band);
        keepOptions(shown, "countdownLook", (v) => v !== "band" || band);
        const mapOn =
          Boolean(props.map && props.map !== "none") ||
          titlePartsOf(props).includes("map");
        keepOptions(
          shown,
          "preciseAt",
          (v) => mapOn || !["above-map", "on-map", "below-map"].includes(v),
        );
        keepOptions(
          shown,
          "descriptionAt",
          (v) => v !== "after-title" || props.showTitle !== false,
        );
        // Essentials: no heading words with the heading off, and no even
        // grid for looks where it's the same as wrapping.
        const essentials = shown.essentials as
          { objectFields?: Record<string, unknown> } | undefined;
        const e = (props.essentials ?? {}) as Record<string, unknown>;
        if (essentials?.objectFields) {
          const sub = { ...essentials.objectFields };
          if (e.heading === false) delete sub.headingText;
          const look = String(e.look ?? "pills");
          const { tabletLook, phoneLook } = deviceLooks(
            look,
            e.tabletLook,
            e.phoneLook,
          );
          for (const [key, deviceLook] of [
            ["arrange", look],
            ["tabletArrange", tabletLook],
            ["phoneArrange", phoneLook],
          ] as const)
            keepOptions(
              sub,
              key,
              (v) => v !== "grid" || !ESSENTIALS_NO_GRID.includes(deviceLook),
            );
          shown.essentials = {
            ...essentials,
            objectFields: sub,
          } as (typeof fields)["essentials"];
        }
        // Messages in the title box: the ribbon can't show them as well.
        const titleMessages = (props.titleMessages ?? "none") !== "none";
        const ribbon = shown.ribbon as
          { options?: { value: string }[] } | undefined;
        if (titleMessages && ribbon?.options) {
          shown.ribbon = {
            ...ribbon,
            options: ribbon.options.filter(
              (option) => option.value !== "messages",
            ),
          } as (typeof fields)["ribbon"];
        }
        return foldDetailsFields(shown, props);
      },
      fields: {
        _cardSection: section(
          "Card",
          "The card itself: its frame and the space inside it.",
        ),
        tone: {
          type: "select",
          label: "Card frame",
          options: options([
            ["card", "Card (border and shadow)"],
            ["tint", "Light grey card"],
            ["plain", "No card"],
          ]),
        },
        inset: {
          type: "select",
          label: "Space inside the card",
          options: options([
            ["auto", "Automatic (none without a frame)"],
            ["none", "None"],
            ["normal", "Normal"],
            ["roomy", "Roomy"],
          ]),
        },
        _ribbonSection: section(
          "Ribbon",
          "A band across the top or bottom of the card.",
        ),
        ribbon: {
          type: "select",
          label: "Ribbon shows",
          options: [
            { value: "none", label: "No ribbon" },
            { value: "status", label: "Where the walk is up to" },
            { value: "messages", label: "The walk's messages" },
            { value: "countdown", label: "Countdown" },
            { value: "when-where", label: "When and where" },
            { value: "text", label: "Your own words" },
          ],
        },
        ribbonText: {
          type: "text",
          label: "Ribbon words (for Your own words)",
        },
        ribbonStyle: {
          type: "select",
          label: "Ribbon look",
          options: [
            { value: "soft", label: "Soft colours" },
            { value: "bold", label: "Bold colours" },
            { value: "plain", label: "Plain, with a line under it" },
            { value: "bar", label: "Thin colour bar only (no words)" },
          ],
        },
        ribbonAt: {
          type: "radio",
          label: "Ribbon position",
          options: options([
            ["top", "Top"],
            ["bottom", "Bottom"],
          ]),
        },
        _titleSection: foldSection(
          "Title",
          "The walk name, its status and the Clock in + Manage buttons.",
          (p) =>
            p.showTitle === false
              ? "Off"
              : [
                  said(
                    p.titleLook,
                    {
                      standard: "Standard",
                      plain: "Plain",
                      band: "Status band",
                    },
                    "Standard",
                  ),
                  Array.isArray(p.titleParts) && p.titleParts.length
                    ? `${p.titleParts.length} inside`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · "),
        ),
        showTitle: { type: "radio", label: "Show the title", options: yesNo },
        titleLook: {
          type: "select",
          label: "Title look",
          options: [
            { value: "standard", label: "Standard (options below)" },
            // Facts in the title: use Where the facts go instead, so the
            // facts take the Facts shown as look and never show twice.
            ...TITLE_LOOKS.filter(
              ([value]) => value !== "chips" && value !== "stats",
            ).map(([value, label]) => ({ value, label })),
          ],
        },
        bandStyle: {
          type: "select",
          label: "Band style (Status band looks)",
          options: [
            { value: "grey", label: "Plain grey" },
            { value: "outline", label: "Plain, with a line under it" },
            { value: "bar", label: "Grey with a dark bar on the left" },
            { value: "line", label: "No background, a line under it" },
          ],
        },
        titleGap: {
          type: "radio",
          label: "Space between the things in the title box (not the edges)",
          options: options([
            ["closer", "Closer"],
            ["normal", "Normal (24px)"],
            ["more", "More"],
          ]),
        },
        titleParts: {
          type: "array",
          label:
            "Inside the title box (under the name) — + Add, drag to reorder",
          arrayFields: {
            part: {
              type: "select",
              label: "Part",
              options: options([
                ["facts", "Facts"],
                ["essentials", "Essentials"],
                ["precise", "Precise location"],
                ["timeline", "The day's timeline"],
                ["description", "Description"],
                ["map", "Map"],
                ["clockin", "Your clock-in (once clocked in)"],
                ["countdown", "Countdown (e.g. 3 days to go)"],
              ]),
            },
          },
          defaultItemProps: { part: "description" },
          getItemSummary: (item: { part?: string }) =>
            TITLE_PART_NAMES[item.part ?? ""] ?? "Choose a part",
        },
        titleExtrasAt: {
          type: "radio",
          label: "Your clock-in and Countdown go",
          options: options([
            ["list", "In the list's order"],
            ["under-name", "Right under Created by"],
          ]),
        },
        clockinLook: {
          type: "select",
          label: "Your clock-in look",
          options: options([
            ["line", "Plain line"],
            ["grey", "Grey background"],
            ["pill", "Grey pill with a tick"],
            ["outline", "Outlined box"],
            ["bar", "Grey bar down the side"],
            ["tick", "Plain, with a tick"],
            ["badge", "Outlined badge with a tick"],
            ["card", "White card"],
            ["stacked", "Two lines in a grey box, with a tick"],
            ["underline", "With a line under it"],
          ]),
        },
        countdownLook: {
          type: "select",
          label: "Countdown look",
          options: options([
            ["line", "Plain line"],
            ["grey", "Grey background"],
            ["pill", "Grey pill with a clock"],
            ["outline", "Outlined box"],
            ["bar", "Grey bar down the side"],
            ["big", "Big number"],
            ["band", "In the status band (… · 7 days to go)"],
          ]),
        },
        titleBox: boxField("Box around the title (name, status, Manage)"),
        statusLook: {
          type: "select",
          label: "Status (Upcoming · Clock-in opens…)",
          options: options([
            ["badge-line", "Badge and words"],
            ["badge", "Badge only"],
            ["line", "Words only"],
            ["pill", "Coloured pill"],
            ["none", "Hidden"],
          ]),
        },
        statusAt: {
          type: "radio",
          label: "Status position",
          options: options([
            ["above", "Above the walk name"],
            ["below", "Below the walk name"],
          ]),
        },
        bigTitle: { type: "radio", label: "Big title", options: yesNo },
        showActions: {
          type: "radio",
          label: "Clock in + Manage",
          options: yesNo,
        },
        titleMessages: {
          type: "select",
          label: "Messages in the title box",
          options: [
            { value: "none", label: "No" },
            { value: "top-row", label: "At the top, as a row (table look)" },
            {
              value: "bottom-row",
              label: "At the bottom, as a row (table look)",
            },
            { value: "top-boxes", label: "At the top, as message boxes" },
            { value: "bottom-boxes", label: "At the bottom, as message boxes" },
            {
              value: "in-band",
              label: "Inside the status band, plain (Status band title looks)",
            },
          ],
        },
        _mapSection: foldSection(
          "Map",
          "The meeting point map inside the card.",
          (p) =>
            said(
              p.map,
              {
                none: "Off",
                top: "At the top",
                side: "Down the side",
                bottom: "At the bottom",
              },
              "Off",
            ),
        ),
        map: {
          type: "select",
          label: "Map in the card",
          options: options([
            ["none", "No map"],
            ["top", "Along the top"],
            ["side", "Down the side"],
            ["bottom", "Along the bottom"],
          ]),
        },
        mapButtons: {
          type: "select",
          label: "Map's directions buttons",
          options: options([
            ["below", "Below the map"],
            ["above", "Above the map"],
            ["none", "Hide them"],
          ]),
        },
        mapButtonsLook: {
          ...directionsLookField,
          label: "Map's directions buttons look",
        },
        mapHeight: {
          type: "radio",
          label: "Map height",
          options: options([
            ["short", "Short"],
            ["medium", "Medium"],
            ["tall", "Tall"],
          ]),
        },
        mapCorners: {
          ...cornersField,
          label: "Map corners",
        },
        mapTitle: {
          type: "radio",
          label: "Map's Meeting point title",
          options: yesNo,
        },
        mapNote: {
          type: "radio",
          label: "Map's small print (OpenStreetMap…)",
          options: yesNo,
        },
        _preciseSection: foldSection(
          "Precise location",
          "The what3words address.",
          (p) => (!p.preciseAt || p.preciseAt === "none" ? "Off" : "On"),
        ),
        preciseAt: {
          type: "select",
          label: "Precise location (what3words)",
          options: [
            { value: "none", label: "Not in the card" },
            { value: "above-facts", label: "Above the facts" },
            { value: "below-facts", label: "Below the facts" },
            { value: "above-map", label: "Above the map" },
            { value: "on-map", label: "On the map" },
            { value: "below-map", label: "Below the map" },
            { value: "bottom", label: "At the bottom of the card" },
          ],
        },
        preciseLook: preciseLookField,
        _factsSection: foldSection(
          "Facts",
          "Date, times, meeting point, distance and the rest.",
          (p) =>
            FACTS_AS_OPTIONS.find(
              (o) => o.value === keptFactsAs(p.factsAs),
            )?.label.replace(/ \(.*\)$/, "") ?? "",
        ),
        factsAs: {
          type: "select",
          label: "Facts shown as (computers)",
          options: FACTS_AS_OPTIONS,
        },
        tabletFactsAs: {
          type: "select",
          label: "Facts shown as on tablets",
          options: [
            { value: "same", label: "Same as on computers" },
            { value: "phone", label: "Same as on phones" },
            ...DEVICE_FACTS_AS,
          ],
        },
        phoneFactsAs: {
          type: "select",
          label: "Facts shown as on phones",
          options: [
            { value: "same", label: "Same as on computers" },
            ...DEVICE_FACTS_AS,
          ],
        },
        factsBorder: {
          type: "radio",
          label: "Outer border round the facts",
          options: [
            { label: "On", value: true },
            { label: "Off", value: false },
          ],
        },
        facts: {
          type: "select",
          label: "Plain facts look on computers",
          options: factsOptions,
        },
        factsArrange: { ...arrangeField, label: "Facts arrange on computers" },
        tabletFacts: {
          type: "select",
          label: "Plain facts look on tablets",
          options: tabletFactsOptions,
        },
        tabletFactsArrange: {
          ...tabletArrangeField,
          label: "Facts arrange on tablets",
        },
        phoneFacts: {
          type: "select",
          label: "Plain facts look on phones",
          options: phoneFactsOptions,
        },
        phoneFactsArrange: {
          ...phoneArrangeField,
          label: "Facts arrange on phones",
        },
        factLines: { ...factLinesField, label: "Lines in the facts list" },
        showEmptyFacts: showEmptyField,
        factsGap: factsGapField,
        factsTitle: {
          type: "text",
          label: "Facts heading (blank: no heading)",
        },
        factsBox: boxField("Box around the facts (computers)"),
        tabletFactsBox: tabletBoxField("Box around the facts (tablets)"),
        phoneFactsBox: phoneBoxField("Box around the facts (phones)"),
        _timelineSection: foldSection(
          "Timeline",
          "The day from clock-in opening to the finish.",
          (p) =>
            p.timeline || titlePartsOf(p).includes("timeline") ? "On" : "Off",
        ),
        timeline: {
          type: "radio",
          label: "The day's timeline",
          options: yesNo,
        },
        timelineLook: timelineLookField,
        ...timelineItemFields,
        timelineTitle: {
          type: "text",
          label: "Timeline heading (blank: no heading)",
        },
        timelineBox: boxField("Box around the day's timeline"),
        _essentialsSection: foldSection(
          "Essentials",
          "Toilets, parking, dogs and the rest.",
          (p) => (p.showEssentials === false ? "Off" : "On"),
        ),
        showEssentials: { type: "radio", label: "Essentials", options: yesNo },
        essentials: {
          type: "object",
          label: "Essentials in the card",
          objectFields: essentialsFields,
        },
        _descriptionSection: foldSection(
          "Description",
          "The walk’s description from Edit walk.",
          (p) =>
            titlePartsOf(p).includes("description")
              ? "In the title box"
              : p.showDescription === false
                ? "Off"
                : "On",
        ),
        showDescription: {
          type: "radio",
          label: "Description",
          options: yesNo,
        },
        descriptionAt: {
          type: "radio",
          label: "Description position",
          options: options([
            ["own", "Lower down, after the facts and essentials"],
            ["after-title", "Just below the title box"],
          ]),
        },
        descriptionTitle: {
          type: "text",
          label: "Description heading (blank: no heading)",
        },
        descriptionBox: boxField("Box around the description"),
        // The More … options switches (placed by foldDetailsFields).
        _titleMore: moreToggle("title"),
        _mapMore: moreToggle("map"),
        _factsMore: moreToggle("facts"),
        _timelineMore: moreToggle("timeline"),
        _descriptionMore: moreToggle("description"),
      },
      defaultProps: {
        factsAs: "facts",
        facts: "grid",
        factsArrange: "fill",
        map: "none",
        mapButtons: "below",
        mapHeight: "medium",
        mapTitle: true,
        mapNote: true,
        preciseAt: "none",
        preciseLook: "card",
        mapCorners: "rounded",
        inset: "auto",
        statusLook: "badge-line",
        statusAt: "above",
        mapButtonsLook: "default",
        tone: "card",
        showTitle: true,
        showActions: true,
        showEssentials: true,
        showDescription: true,
        ribbon: "none",
        ribbonStyle: "soft",
        ribbonText: "",
        ribbonAt: "top",
        phoneFacts: "same",
        phoneFactsArrange: "same",
        tabletFacts: "same",
        tabletFactsArrange: "same",
        showEmptyFacts: false,
        titleLook: "standard",
        bandStyle: "grey",
        titleBox: "none",
        titleMessages: "none",
        factsGap: "normal",
        factsTitle: "",
        timelineTitle: "",
        factLines: "between",
        factsBox: "none",
        tabletFactsBox: "same",
        phoneFactsBox: "same",
        timelineBox: "none",
        descriptionAt: "own",
        descriptionTitle: "",
        descriptionBox: "none",
        essentials: ESSENTIALS_DEFAULTS,
        timeline: false,
        timelineLook: "bar",
        timelineOpens: true,
        timelineStart: true,
        timelineEnd: true,
        titleGap: "normal",
        titleParts: [],
        titleExtrasAt: "list",
        clockinLook: "line",
        countdownLook: "line",
        factsBorder: true,
        tabletFactsAs: "same",
        phoneFactsAs: "same",
        bigTitle: false,
      },
      render: ({
        factsAs,
        facts,
        factsArrange,
        map,
        mapButtons,
        mapHeight,
        mapTitle,
        mapNote,
        preciseAt,
        preciseLook,
        mapCorners,
        inset,
        statusLook,
        statusAt,
        mapButtonsLook,
        puck,
        tone,
        showTitle,
        showActions,
        showEssentials,
        showDescription,
        ribbon,
        ribbonStyle,
        ribbonText,
        ribbonAt,
        phoneFacts,
        phoneFactsArrange,
        tabletFacts,
        tabletFactsArrange,
        showEmptyFacts,
        essentials,
        titleLook,
        bandStyle,
        titleBox,
        titleMessages,
        factsGap,
        factsTitle,
        timelineTitle,
        factLines,
        factsBox,
        tabletFactsBox,
        phoneFactsBox,
        timelineBox,
        descriptionAt,
        descriptionTitle,
        descriptionBox,
        timeline,
        factsAt,
        timelineAt,
        timelineLook,
        timelineOpens,
        timelineStart,
        timelineEnd,
        titleGap,
        titleOrder,
        titleParts,
        titleExtrasAt,
        clockinLook,
        countdownLook,
        factsBorder,
        tabletFactsAs,
        phoneFactsAs,
        bigTitle,
      }) => (
        <DetailsBlock
          factsAs={factsAs}
          bigTitle={bigTitle}
          facts={facts}
          factsArrange={factsArrange}
          map={map}
          mapButtons={mapButtons}
          mapHeight={mapHeight}
          mapNote={mapNote}
          mapTitle={mapTitle}
          preciseAt={preciseAt}
          preciseLook={preciseLook}
          mapCorners={mapCorners}
          inset={inset}
          statusLook={statusLook}
          statusAt={statusAt}
          mapButtonsLook={mapButtonsLook}
          editing={Boolean(puck?.isEditing)}
          phoneFacts={phoneFacts}
          phoneFactsArrange={phoneFactsArrange}
          tabletFacts={tabletFacts}
          tabletFactsArrange={tabletFactsArrange}
          showEmptyFacts={showEmptyFacts}
          titleLook={titleLook}
          bandStyle={bandStyle}
          titleBox={titleBox}
          titleMessages={titleMessages}
          factsGap={factsGap}
          factsTitle={factsTitle}
          timelineTitle={timelineTitle}
          factLines={factLines}
          factsBox={factsBox}
          tabletFactsBox={tabletFactsBox}
          phoneFactsBox={phoneFactsBox}
          timelineBox={timelineBox}
          descriptionAt={descriptionAt}
          descriptionTitle={descriptionTitle}
          descriptionBox={descriptionBox}
          essentials={essentials}
          ribbon={ribbon}
          ribbonAt={ribbonAt}
          ribbonStyle={ribbonStyle}
          ribbonText={ribbonText}
          showActions={showActions}
          showDescription={showDescription}
          showEssentials={showEssentials}
          showTitle={showTitle}
          timeline={timeline}
          factsAt={factsAt}
          timelineAt={timelineAt}
          timelineLook={timelineLook}
          timelineOpens={timelineOpens}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          titleGap={titleGap}
          titleOrder={titleOrder}
          titleParts={titleParts}
          titleExtrasAt={titleExtrasAt}
          clockinLook={clockinLook}
          countdownLook={countdownLook}
          factsBorder={factsBorder}
          tabletFactsAs={tabletFactsAs}
          phoneFactsAs={phoneFactsAs}
          tone={tone}
        />
      ),
    },
    Facts: {
      label: "Facts",
      resolveFields: (data, { fields }) => {
        const props = data.props as Record<string, unknown>;
        const shown = { ...fields } as Record<string, unknown>;
        const computer = String(props.variant ?? "grid");
        const { tabletLook, phoneLook } = deviceLooks(
          computer,
          props.tabletVariant,
          props.phoneVariant,
        );
        limitArranges(shown, [
          ["arrange", computer],
          ["tabletArrange", tabletLook],
          ["phoneArrange", phoneLook],
        ]);
        return shown as typeof fields;
      },
      fields: {
        variant: {
          type: "select",
          label: "On computers: look",
          options: factsOptions,
        },
        arrange: { ...arrangeField, label: "On computers: arrange" },
        phoneVariant: {
          type: "select",
          label: "On phones: look",
          options: phoneFactsOptions,
        },
        phoneArrange: phoneArrangeField,
        tabletVariant: {
          type: "select",
          label: "On tablets: look",
          options: tabletFactsOptions,
        },
        tabletArrange: tabletArrangeField,
        showEmpty: showEmptyField,
        heading: { type: "text", label: "Heading (blank: no heading)" },
        gap: factsGapField,
        lines: factLinesField,
        box: boxField("On computers: box"),
        tabletBox: tabletBoxField("On tablets: box"),
        phoneBox: phoneBoxField("On phones: box"),
      },
      defaultProps: {
        box: "none",
        tabletBox: "same",
        phoneBox: "same",
        lines: "between",
        heading: "",
        gap: "normal",
        variant: "grid",
        arrange: "fill",
        phoneVariant: "same",
        phoneArrange: "same",
        tabletVariant: "same",
        tabletArrange: "same",
        showEmpty: false,
      },
      render: ({
        variant,
        arrange,
        phoneVariant,
        phoneArrange,
        tabletVariant,
        tabletArrange,
        showEmpty,
        box,
        tabletBox,
        phoneBox,
        lines,
        heading,
        gap,
      }) => (
        <FactsBlock
          gap={gap}
          heading={heading}
          lines={lines}
          box={box}
          tabletBox={tabletBox}
          phoneBox={phoneBox}
          showEmpty={showEmpty}
          arrange={arrange}
          phoneArrange={phoneArrange}
          phoneVariant={phoneVariant}
          tabletArrange={tabletArrange}
          tabletVariant={tabletVariant}
          variant={variant}
        />
      ),
    },
    Essentials: {
      label: "Essentials",
      fields: essentialsFields,
      defaultProps: ESSENTIALS_DEFAULTS,
      render: ({
        look,
        arrange,
        tabletLook,
        tabletArrange,
        phoneLook,
        phoneArrange,
        heading,
        headingText,
        showEmpty,
        box,
        tabletBox,
        phoneBox,
      }) => (
        <EssentialsBlock
          headingText={headingText}
          box={box}
          tabletBox={tabletBox}
          phoneBox={phoneBox}
          arrange={arrange}
          heading={heading}
          look={look}
          phoneArrange={phoneArrange}
          phoneLook={phoneLook}
          showEmpty={showEmpty}
          tabletArrange={tabletArrange}
          tabletLook={tabletLook}
        />
      ),
    },
    Description: {
      label: "Description",
      fields: {
        heading: { type: "text", label: "Heading (blank: no heading)" },
      },
      defaultProps: { heading: "" },
      render: ({ heading }) => <DescriptionBlock heading={heading} />,
    },
    Actions: {
      label: "Clock in + Manage",
      fields: {
        align: {
          type: "select",
          label: "Position",
          options: options([
            ["start", "Left"],
            ["end", "Right"],
            ["full", "Full width"],
          ]),
        },
        show: {
          type: "select",
          label: "Buttons",
          options: options([
            ["both", "Clock in + Manage"],
            ["manage", "Manage only"],
            ["clock", "Clock in only"],
          ]),
        },
      },
      defaultProps: { align: "start", show: "both" },
      render: ({ align, show }) => <ActionsBlock align={align} show={show} />,
    },
    ClockInButton: {
      label: "Clock in button",
      fields: {
        align: {
          type: "select",
          label: "Position",
          options: options([
            ["start", "Left"],
            ["end", "Right"],
            ["full", "Full width"],
          ]),
        },
      },
      defaultProps: { align: "start" },
      render: ({ align }) => <ActionsBlock align={align} show="clock" />,
    },
    ManageButton: {
      label: "Manage button",
      fields: {
        align: {
          type: "select",
          label: "Position",
          options: options([
            ["start", "Left"],
            ["end", "Right"],
            ["full", "Full width"],
          ]),
        },
      },
      defaultProps: { align: "start" },
      render: ({ align }) => <ActionsBlock align={align} show="manage" />,
    },
    WalkName: {
      label: "Walk name",
      fields: {
        size: {
          type: "radio",
          label: "Size",
          options: options([
            ["small", "Small"],
            ["large", "Large"],
            ["huge", "Huge"],
          ]),
        },
      },
      defaultProps: { size: "large" },
      render: ({ size }) => <WalkNameBlock size={size} />,
    },
    StatusBadge: {
      label: "Status badge",
      fields: {
        withLine: {
          type: "radio",
          label: "With its line of words",
          options: yesNo,
        },
      },
      defaultProps: { withLine: true },
      render: ({ withLine }) => <StatusBadgeBlock withLine={withLine} />,
    },
    Countdown: {
      label: "Countdown",
      fields: {
        look: {
          type: "radio",
          label: "Look",
          options: options([
            ["big", "Big number"],
            ["box", "Coloured box"],
            ["pill", "Small pill"],
          ]),
        },
      },
      defaultProps: { look: "big" },
      render: ({ look }) => <CountdownBlock look={look} />,
    },
    Timeline: {
      label: "The day's timeline",
      fields: { look: timelineLookField, ...timelineItemFields },
      defaultProps: {
        look: "bar",
        timelineOpens: true,
        timelineStart: true,
        timelineEnd: true,
      },
      render: ({ look, timelineOpens, timelineStart, timelineEnd }) => (
        <TimelineBlock
          end={timelineEnd}
          look={look}
          opens={timelineOpens}
          start={timelineStart}
        />
      ),
    },
    Fact: {
      label: "One fact",
      fields: {
        fact: {
          type: "select",
          label: "Fact",
          options: FACT_NAMES.map((name) => ({ label: name, value: name })),
        },
        look: {
          type: "radio",
          label: "Look",
          options: options([
            ["tile", "Tile"],
            ["line", "One line"],
            ["big", "Big"],
          ]),
        },
      },
      defaultProps: { fact: "Date", look: "tile" },
      render: ({ fact, look }) => <FactBlock fact={fact} look={look} />,
    },
    Status: {
      label: "Status",
      fields: {
        variant: {
          type: "select",
          label: "Look",
          options: options<StatusVariant>([
            ["box", "Coloured box"],
            ["line", "One line"],
            ["band", "Thin colour bar"],
            ["takeover", "Big countdown"],
            ["ring", "Countdown ring"],
            ["stepper", "Four steps"],
            ["timeline", "The day's timeline"],
            ["numbers", "Big numbers"],
            ["phases", "Before · During · After"],
          ]),
        },
      },
      defaultProps: { variant: "box" },
      render: ({ variant }) => <StatusBlock variant={variant} />,
    },
    ClockIn: { label: "Clock-in panel", render: () => <ClockInBlock /> },
    PeopleStack: {
      label: "People clocked in",
      render: () => <PeopleStackBlock />,
    },
    SummaryTiles: {
      label: "Summary tiles",
      fields: {
        tiles: {
          type: "array",
          label: "Tiles — + Add, drag to reorder",
          arrayFields: {
            tile: {
              type: "select",
              label: "Tile",
              options: options([
                ["attended", "Attended"],
                ["meeting", "Meeting point"],
                ["weather", "Weather"],
                ["journey", "Journey"],
                ["date", "Date"],
                ["starts", "Starts"],
                ["finishes", "Finishes"],
                ["length", "Length"],
                ["distance", "Distance"],
                ["climb", "Climb"],
                ["grade", "Grade"],
                ["leader", "Walk leader"],
                ["back-marker", "Back marker"],
                ["refreshment", "Refreshment stop"],
                ["what3words", "what3words"],
              ]),
            },
          },
          defaultItemProps: { tile: "date" },
          getItemSummary: (item: { tile?: string }) =>
            ({
              attended: "Attended",
              meeting: "Meeting point",
              weather: "Weather",
              journey: "Journey",
              date: "Date",
              starts: "Starts",
              finishes: "Finishes",
              length: "Length",
              distance: "Distance",
              climb: "Climb",
              grade: "Grade",
              leader: "Walk leader",
              "back-marker": "Back marker",
              refreshment: "Refreshment stop",
              what3words: "what3words",
            })[item.tile ?? ""] ?? "Choose a tile",
        },
        arrange: arrangeField,
      },
      defaultProps: {
        arrange: "fill",
        tiles: DEFAULT_SUMMARY_TILES.map((tile) => ({ tile })),
      },
      // Pages saved before the list: start it with the four it always showed.
      resolveData: (data) =>
        Array.isArray(data.props.tiles)
          ? data
          : {
              ...data,
              props: {
                ...data.props,
                tiles: DEFAULT_SUMMARY_TILES.map((tile) => ({ tile })),
              },
            },
      render: ({ arrange, tiles }) => (
        <SummaryTilesBlock arrange={arrange} tiles={tiles} />
      ),
    },
    HowItWorks: {
      label: "How this group works",
      fields: {
        look: {
          type: "select",
          label: "Look",
          options: options([
            ["card", "Card (as on the walk page)"],
            ["ticks", "Tick list"],
            ["numbered", "Numbered steps"],
            ["callout", "Grey callout with a side bar"],
            ["tiles", "Numbered tiles"],
            ["swipe", "Tiles in one swiping row"],
            ["compact", "One short line"],
            ["row", "Numbered steps in a row (full width)"],
            ["big-numbers", "Big numbers 01, 02… in columns"],
            ["list", "Numbered list with lines (full width)"],
            ["card-list", "Card list, like the Walks list"],
            ["timeline", "Timeline down the side"],
            ["two-columns", "Two columns of numbered steps"],
            ["grey-row", "Grey boxes across the page"],
            ["outline-row", "Outlined boxes across the page"],
            ["number-cards", "Numbered cards across the page"],
            ["boxed-ticks", "Ticks in one outlined box"],
            ["chips", "Just the titles, as grey chips"],
          ]),
        },
        showTo: {
          type: "radio",
          label: "Shown to",
          options: options([
            ["visitors", "Signed-out visitors"],
            ["members", "Members"],
            ["everyone", "Everyone"],
          ]),
        },
        showHeading: {
          type: "radio",
          label: "Show the heading",
          options: yesNo,
        },
        title: {
          type: "text",
          label: "Heading (blank: How this group works)",
        },
      },
      defaultProps: {
        look: "card",
        title: "",
        showTo: "visitors",
        showHeading: true,
      },
      // The Card look (for visitors) is the page's own card, heading and all.
      resolveFields: (data, { fields }) => {
        const card =
          data.props.look === "card" &&
          (data.props.showTo ?? "visitors") === "visitors";
        const shown = { ...fields } as Record<string, unknown>;
        if (card) delete shown.showHeading;
        if (card || data.props.showHeading === false) delete shown.title;
        return shown as typeof fields;
      },
      render: ({ look, title, showTo, showHeading, puck }) => (
        <HowItWorksBlock
          editing={Boolean(puck?.isEditing)}
          look={look}
          showHeading={showHeading}
          showTo={showTo}
          title={title}
        />
      ),
    },
    StoryCards: {
      label: "Story cards",
      fields: { arrange: arrangeField },
      defaultProps: { arrange: "fill" },
      render: ({ arrange }) => <StoryCardsBlock arrange={arrange} />,
    },
    Bento: { label: "Bento grid", render: () => <BentoBlock /> },
    Ticket: {
      label: "Walk ticket",
      fields: {
        variant: {
          type: "radio",
          label: "Look",
          options: options([
            ["plain", "Plain"],
            ["colour", "Colour"],
          ]),
        },
      },
      defaultProps: { variant: "plain" },
      render: ({ variant }) => <TicketBlock variant={variant} />,
    },
    ColourBlocks: {
      label: "Colour blocks",
      fields: { arrange: arrangeField },
      defaultProps: { arrange: "fill" },
      render: ({ arrange }) => <ColourBlocksBlock arrange={arrange} />,
    },
    Badges: {
      label: "Round badges",
      fields: { arrange: arrangeField },
      defaultProps: { arrange: "fill" },
      render: ({ arrange }) => <BadgesBlock arrange={arrange} />,
    },
    PhasesBoard: { label: "Phases board", render: () => <PhasesBoardBlock /> },
    Map: {
      label: "Map",
      fields: {
        look: {
          type: "select",
          label: "Look",
          options: options([
            ["card", "Card"],
            ["flat", "No frame"],
            ["bare", "Map only"],
            ["overlay", "Details floating over the map"],
            ["split", "Details beside the map"],
          ]),
        },
        buttons: {
          type: "select",
          label: "Directions buttons",
          options: options([
            ["below", "Below the map"],
            ["above", "Above the map"],
            ["over", "On the map"],
            ["none", "Hide them"],
          ]),
        },
        height: {
          type: "radio",
          label: "Map height",
          options: options([
            ["short", "Short"],
            ["medium", "Medium"],
            ["tall", "Tall"],
          ]),
        },
        showTitle: {
          type: "radio",
          label: "Meeting point title",
          options: yesNo,
        },
        showNote: { type: "radio", label: "Small print", options: yesNo },
        preciseAt: {
          type: "select",
          label: "Precise location (what3words)",
          options: [
            { value: "none", label: "Not with the map" },
            { value: "above-map", label: "Above the map" },
            { value: "on-map", label: "On the map" },
            { value: "below-map", label: "Below the map" },
            { value: "after", label: "After the buttons" },
          ],
        },
        preciseLook: preciseLookField,
        buttonsLook: directionsLookField,
        corners: cornersField,
      },
      defaultProps: {
        corners: "rounded",
        buttonsLook: "default",
        look: "card",
        buttons: "below",
        height: "medium",
        showTitle: true,
        showNote: true,
        preciseAt: "none",
        preciseLook: "card",
      },
      render: ({
        look,
        buttons,
        height,
        showTitle,
        showNote,
        preciseAt,
        preciseLook,
        buttonsLook,
        corners,
      }) => (
        <MapBlock
          corners={corners}
          buttonsLook={buttonsLook}
          preciseAt={preciseAt}
          preciseLook={preciseLook}
          buttons={buttons}
          height={height}
          look={look}
          showNote={showNote}
          showTitle={showTitle}
        />
      ),
    },
    Directions: {
      label: "Directions buttons",
      fields: {
        full: { type: "radio", label: "Full width", options: yesNo },
        look: { ...directionsLookField, label: "Look" },
      },
      defaultProps: { full: false, look: "default" },
      render: ({ full, look }) => <DirectionsBlock full={full} look={look} />,
    },
    Weather: { label: "Weather", render: () => <WeatherBlock /> },
    Precise: { label: "Precise location", render: () => <PreciseBlock /> },
    Before: {
      label: "Before you set off",
      fields: {
        look: {
          type: "select",
          label: "Look",
          options: options([
            ["card", "Card (as on the walk page)"],
            ["ticks", "Tick list"],
            ["numbered", "Numbered steps"],
            ["callout", "Grey callout with a side bar"],
            ["tiles", "Numbered tiles"],
            ["swipe", "Tiles in one swiping row"],
            ["compact", "One short paragraph"],
            ["row", "Numbered steps in a row (full width)"],
            ["big-numbers", "Big numbers 01, 02… in columns"],
            ["list", "Numbered list with lines (full width)"],
            ["card-list", "Card list, like the Walks list"],
            ["timeline", "Timeline down the side"],
            ["two-columns", "Two columns of numbered steps"],
            ["grey-row", "Grey boxes across the page"],
            ["outline-row", "Outlined boxes across the page"],
            ["number-cards", "Numbered cards across the page"],
            ["boxed-ticks", "Ticks in one outlined box"],
            ["chips", "Just the titles, as grey chips"],
          ]),
        },
        showHeading: {
          type: "radio",
          label: "Show the heading",
          options: yesNo,
        },
        title: { type: "text", label: "Heading (blank: Before you set off)" },
      },
      defaultProps: { look: "card", title: "", showHeading: true },
      // The Card look is the page's own card, heading and all.
      resolveFields: (data, { fields }) => {
        const card = (data.props.look ?? "card") === "card";
        const shown = { ...fields } as Record<string, unknown>;
        if (card) delete shown.showHeading;
        if (card || data.props.showHeading === false) delete shown.title;
        return shown as typeof fields;
      },
      render: ({ look, title, showHeading }) => (
        <BeforeBlock look={look} showHeading={showHeading} title={title} />
      ),
    },
    Attended: {
      label: "Attended",
      fields: {
        rule: {
          type: "radio",
          label: "Who sees the list (members)",
          options: options([
            ["clocked-in", "Anyone who clocked in (kept after clocking out)"],
            ["on-walk", "Only while on the walk (gone when they clock out)"],
          ]),
        },
      },
      defaultProps: { rule: "clocked-in" },
      render: ({ rule }) => <AttendedBlock rule={rule} />,
    },
    Journey: { label: "Journey", render: () => <JourneyBlock /> },

    // ── Layout ──────────────────────────────────────────────────────────
    Section: {
      label: "Section",
      fields: {
        background: {
          type: "select",
          label: "Background",
          options: options([
            ["none", "None"],
            ["muted", "Light grey"],
            ["green", "Green"],
          ]),
        },
        padding: {
          type: "select",
          label: "Space inside",
          options: options([
            ["none", "None"],
            ["small", "Small"],
            ["large", "Large"],
          ]),
        },
        content: { type: "slot" },
      },
      defaultProps: {
        background: "none",
        padding: "none",
        content: [],
      },
      // Always page width (nothing on a designed page runs edge to edge).
      render: ({ background, padding, content: Content }) => (
        <section
          className={cn(
            background === "muted" && "bg-muted/50",
            background === "dark" && "bg-neutral-950 text-white",
            background === "green" && "bg-emerald-900 text-emerald-50",
            background !== "none" && "rounded-2xl px-6",
            padding === "small" && "py-6",
            padding === "large" && "py-10",
          )}
        >
          <Content className="flex flex-col gap-6" />
        </section>
      ),
    },
    Columns: {
      label: "Columns",
      fields: {
        ratio: {
          type: "select",
          label: "Columns",
          options: options([
            ["1:1", "Two equal"],
            ["2:1", "Wide left, narrow right"],
            ["1:2", "Narrow left, wide right"],
            ["1:1:1", "Three equal"],
          ]),
        },
        gap: {
          type: "select",
          label: "Space between columns",
          options: spaceOptions,
        },
        heights: {
          type: "radio",
          label: "Column heights",
          options: options([
            ["equal", "Equal (the last block in each column stretches)"],
            ["natural", "As tall as their content"],
          ]),
        },
        sticky: {
          type: "select",
          label: "Stays in view as you scroll (computers)",
          options: options([
            ["none", "None"],
            ["left", "Left column"],
            ["right", "Right (second) column"],
            ["third", "Third column"],
          ]),
        },
        left: { type: "slot" },
        right: { type: "slot" },
        third: { type: "slot" },
      },
      defaultProps: {
        ratio: "2:1",
        gap: "normal",
        heights: "equal",
        sticky: "none",
        left: [],
        right: [],
        third: [],
      },
      render: ({
        ratio,
        gap,
        heights,
        sticky,
        stickySecond,
        left: Left,
        right: Right,
        third: Third,
      }) => {
        // Older designs: "Right column stays in view" yes/no.
        const stuck = sticky ?? (stickySecond ? "right" : "none");
        const column = (name: string) =>
          cn(
            "flex min-w-0 flex-col gap-6",
            heights !== "natural" && "[&>*:last-child]:grow",
            stuck === name && "lg:sticky lg:top-24 lg:self-start",
          );
        return (
          <div
            className={cn(
              "grid",
              GAP[gap ?? "normal"] ?? "gap-6",
              ratio === "1:1" && "lg:grid-cols-2",
              ratio === "2:1" && "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
              ratio === "1:2" && "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]",
              ratio === "1:1:1" && "lg:grid-cols-3",
            )}
          >
            <Left className={column("left")} />
            <Right className={column("right")} />
            {ratio === "1:1:1" ? <Third className={column("third")} /> : null}
          </div>
        );
      },
    },
    Sidebar: {
      label: "Sidebar",
      fields: {
        side: {
          type: "radio",
          label: "Side",
          options: options([
            ["left", "Left"],
            ["right", "Right"],
          ]),
        },
        label: { type: "text", label: "Button name on phones" },
        sticky: { type: "radio", label: "Stays in view", options: yesNo },
        sidebar: { type: "slot" },
        main: { type: "slot" },
      },
      defaultProps: {
        side: "right",
        label: "More",
        sticky: true,
        sidebar: [],
        main: [],
      },
      render: ({
        side,
        label,
        sticky,
        sidebar: SidebarContent,
        main: Main,
      }) => (
        <div
          className={cn(
            "grid gap-6",
            side === "left"
              ? "lg:grid-cols-[16rem_minmax(0,1fr)]"
              : "lg:grid-cols-[minmax(0,1fr)_18rem]",
          )}
        >
          {side === "left" ? (
            <div className={cn(sticky && "lg:sticky lg:top-24 lg:self-start")}>
              <MobileSidebar label={label || "More"} side="left">
                <SidebarContent className="flex flex-col gap-6" />
              </MobileSidebar>
            </div>
          ) : null}
          <Main className="flex min-w-0 flex-col gap-6" />
          {side === "right" ? (
            <div
              className={cn(
                "max-lg:order-first",
                sticky && "lg:sticky lg:top-24 lg:self-start",
              )}
            >
              <MobileSidebar label={label || "More"} side="right">
                <SidebarContent className="flex flex-col gap-6" />
              </MobileSidebar>
            </div>
          ) : null}
        </div>
      ),
    },
    Card: {
      label: "Card",
      fields: {
        tone: {
          type: "select",
          label: "Look",
          options: options([
            ["card", "Card"],
            ["tint", "Tinted"],
            ["outline", "Outline only"],
          ]),
        },
        content: { type: "slot" },
      },
      defaultProps: { tone: "card", content: [] },
      render: ({ tone, content: Content }) => (
        <div
          className={cn(
            "overflow-hidden rounded-2xl",
            tone === "card" && "border bg-card shadow-sm",
            tone === "tint" && "bg-muted/40",
            tone === "dark" && "bg-neutral-950 text-white",
            tone === "outline" && "border",
          )}
        >
          <Content className="flex flex-col gap-6 p-6" />
        </div>
      ),
    },
    Tabs: {
      label: "Tabs",
      fields: {
        style: {
          type: "select",
          label: "Style",
          options: options([
            ["site", "The site's tab style (Settings)"],
            ["standard", "Grey pill"],
            ["underline", "Sliding underline"],
            ["transition", "Pills that drop in"],
          ]),
        },
        look: {
          type: "select",
          label: "Tab look",
          options: options([
            ["style", "Use the Style above"],
            ["enclosed", "Folder tabs (Chakra enclosed)"],
            ["enclosed-colour", "Coloured folder tabs (Chakra)"],
            ["soft-rounded", "Soft green pills (Chakra)"],
            ["solid-rounded", "Solid pills (Chakra / HeroUI)"],
            ["bordered", "Bordered box (HeroUI)"],
            ["light", "Light (HeroUI)"],
            ["outline-pills", "Outline pills (Mantine)"],
            ["segments", "Joined segments (Origin UI)"],
            ["overline", "Line on top"],
            ["words", "Plain words, bold when chosen"],
            ["capsule", "Rounded capsule (grey track)"],
            ["capsule-dark", "Rounded capsule, dark when chosen"],
            ["floating", "Floating pills with a shadow"],
            ["material", "Material: capitals with a thick underline"],
            ["green-underline", "Green underline, spaced words"],
            ["cards", "Little cards"],
            ["tinted-box", "Green box"],
            ["big-words", "Big words, underlined when chosen"],
            ["square-blocks", "Square blocks"],
          ]),
        },
        position: {
          type: "radio",
          label: "Tab bar position (computers)",
          options: options([
            ["top", "Above the content"],
            ["side", "Down the left side"],
          ]),
        },
        contentSpace: {
          type: "select",
          label: "Space between the tabs and their content",
          options: spaceOptions,
        },
        innerSpace: {
          type: "select",
          label: "Space between blocks in a tab",
          options: spaceOptions,
        },
        emptyTabs: {
          type: "radio",
          label: "Tabs with nothing in them (e.g. Weather after the walk)",
          options: options([
            ["hide", "Hide them"],
            ["note", "Show them, with a short note"],
          ]),
        },
        corners: {
          type: "radio",
          label: "Tab corners",
          options: options([
            ["as-is", "As the style has them"],
            ["square", "Square"],
            ["rounded", "Rounded"],
            ["pill", "Fully rounded"],
          ]),
        },
        fit: {
          type: "radio",
          label: "Tab widths",
          options: options([
            ["fill", "Share the full width"],
            ["names", "Fit the names, from the left"],
            ["centre", "Fit the names, centred"],
          ]),
        },
        sticky: {
          type: "radio",
          label: "Stays at the top as you scroll",
          options: yesNo,
        },
        tabs: {
          type: "array",
          label: "Tabs",
          arrayFields: {
            label: { type: "text", label: "Name" },
            content: { type: "slot" },
          },
          defaultItemProps: { label: "New tab", content: [] },
          getItemSummary: (item: { label?: string }) => item.label || "Tab",
        },
      },
      defaultProps: {
        style: "site",
        corners: "as-is",
        emptyTabs: "hide",
        contentSpace: "normal",
        innerSpace: "normal",
        look: "style",
        position: "top",
        fit: "fill",
        sticky: true,
        tabs: [
          { label: "Map & weather", content: [] },
          { label: "Attended", content: [] },
          { label: "Journey", content: [] },
        ],
      },
      render: ({
        style,
        corners,
        contentSpace,
        innerSpace,
        look,
        position,
        fit,
        sticky,
        tabs,
        emptyTabs,
        puck,
      }) => {
        const view = (
          <TabsView
            contentSpace={contentSpace}
            corners={corners}
            innerSpace={innerSpace}
            look={look}
            side={position === "side"}
            // In the designer every tab's area is shown, one under another,
            // so blocks can be dropped into any tab.
            editing={Boolean(puck?.isEditing)}
            emptyTabs={emptyTabs}
            fit={fit}
            list={(tabs ?? []) as TabItem[]}
            sticky={sticky}
          />
        );
        // "The site's tab style" follows Settings; the others set this bar's own.
        // A tab look sits on the plain grey-pill tabs.
        if (look && look !== "style")
          return <TabStyleProvider style="standard">{view}</TabStyleProvider>;
        return style && style !== "site" ? (
          <TabStyleProvider style={style as TabStyle}>{view}</TabStyleProvider>
        ) : (
          view
        );
      },
    },
    Folding: {
      label: "Folding sections",
      fields: {
        items: {
          type: "array",
          label: "Sections",
          arrayFields: {
            label: { type: "text", label: "Name" },
            open: { type: "radio", label: "Open to start", options: yesNo },
            content: { type: "slot" },
          },
          defaultItemProps: { label: "New section", open: false, content: [] },
          getItemSummary: (item: { label?: string }) => item.label || "Section",
        },
      },
      defaultProps: {
        items: [{ label: "Map & weather", open: true, content: [] }],
      },
      render: ({ items, puck }) => {
        const list = (items ?? []) as {
          label: string;
          open: boolean;
          content: (props: { className?: string }) => React.ReactNode;
        }[];
        return (
          <Accordion
            className={cn("rounded-2xl border px-4")}
            // All open in the designer, so blocks can be dropped into each.
            defaultValue={list.flatMap((item, i) =>
              item.open || puck?.isEditing ? [`item-${i}`] : [],
            )}
            key={puck?.isEditing ? "editing" : "page"}
            type="multiple"
          >
            {list.map((item, i) => {
              const Content = item.content;
              return (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-base">
                    {item.label}
                  </AccordionTrigger>
                  <AccordionContent>
                    <Content className="flex flex-col gap-6" />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        );
      },
    },
    Spacer: {
      label: "Space",
      fields: {
        size: {
          type: "select",
          label: "Size",
          options: options([
            ["small", "Small"],
            ["medium", "Medium"],
            ["large", "Large"],
          ]),
        },
      },
      defaultProps: { size: "medium" },
      render: ({ size }) => (
        <div
          aria-hidden
          className={
            size === "small" ? "h-2" : size === "large" ? "h-12" : "h-6"
          }
        />
      ),
    },
    Divider: { label: "Line", render: () => <hr /> },
    Heading: {
      label: "Heading",
      fields: { text: { type: "text", label: "Text" } },
      defaultProps: { text: "Heading" },
      render: ({ text }) => <h2 className="text-lg font-semibold">{text}</h2>,
    },
    Text: {
      label: "Text",
      fields: { text: { type: "textarea", label: "Text" } },
      defaultProps: { text: "" },
      render: ({ text }) => (
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {text}
        </p>
      ),
    },
  }),
  // Page settings (shown on the right when no block is selected).
  root: {
    fields: {
      messagesAt: {
        type: "select",
        label: "Where the walk's messages go",
        options: [
          { value: "block", label: "Where I put the Messages block" },
          { value: "top", label: "At the top, page width (like a block)" },
        ],
      },
      messagesLook: { ...messageLookField, label: "Messages look" },
    },
    defaultProps: { messagesAt: "block", messagesLook: "as-is" },
    render: ({
      children,
      puck,
      messagesLook,
      messagesAt,
    }: {
      children: React.ReactNode;
      puck?: { isEditing?: boolean };
      messagesLook?: MessageLook;
      messagesAt?: MessagesAt;
    }) => (
      <PageRoot
        editing={Boolean(puck?.isEditing)}
        messagesAt={messagesAt}
        messagesLook={messagesLook}
      >
        {children}
      </PageRoot>
    ),
  },
};
