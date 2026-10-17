"use client";

import type { ComponentConfig, Config } from "@puckeditor/core";
import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { PreviewAudience, WalkPartsProvider, useWalkParts } from "./parts";
import { ReadyLayoutBlock } from "./ready-layout-block";
import { READY_LAYOUTS } from "./ready-layouts";
import { cn } from "@/lib/utils";
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
  ],
};
const messageLookField = {
  type: "select" as const,
  label: "Messages look",
  options: options<MessageLook>([
    ["as-is", "As designed"],
    ["soft", "Soft grey, no border"],
    ["bold", "Bold (dark)"],
    ["compact", "Compact"],
    ["stripe", "Coloured stripe down the side"],
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

// Every title look (the Title block and the Details card's title).
const TITLE_LOOKS: [string, string][] = [
  ["plain", "Plain"],
  ["chips", "With fact chips"],
  ["stats", "Big name and four key facts"],
  ["band", "Status band"],
  ["magazine", "Magazine"],
  ["poster", "Poster"],
  ["trailhead", "Trailhead sign"],
  ["calendar", "Calendar date"],
  ["split", "Coloured time block"],
  ["contours", "Contour lines"],
  ["typographic", "Huge start time"],
  ["centred", "Centred"],
  ["eyebrow", "Date above, in green capitals"],
  ["date-strip", "Date strip (day, sets off, back by)"],
  ["countdown", "Big countdown beside the name"],
  ["underline", "Green underline bar"],
  ["status-bar", "Status-coloured bar down the side"],
  ["two-tone", "Name with the meeting point under it"],
  ["pill-row", "Row of pills above the name"],
  ["minimal", "Minimal: name and date on one line"],
  ["giant-date", "Giant faded date behind the name"],
  ["meta-table", "Name with a table (status, date, time, meet)"],
  ["hero", "Hero: huge name"],
];

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
  label: "Block layout",
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
}: {
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
    .filter(({ i }) => editing || !empty[i]);
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
          corners === "square" &&
            "[&_[data-slot=tabs-list]]:rounded-none [&_[data-slot=tabs-trigger]]:rounded-none",
          corners === "rounded" &&
            "[&_[data-slot=tabs-list]]:rounded-xl [&_[data-slot=tabs-trigger]]:rounded-lg",
          corners === "pill" &&
            "[&_[data-slot=tabs-list]]:rounded-full [&_[data-slot=tabs-trigger]]:rounded-full",
          // Out to the page's edges, square ends (the panels stay page width).
          TAB_LOOKS[look],
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
            ref={(el: HTMLDivElement | null) => {
              panels.current[i] = el;
            }}
            value={`tab-${i}`}
          >
            <Content className={cn("flex flex-col", inner)} />
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
   * page at page width like any block; "strip", a full-width strip straight
   * under the site header; "block", wherever the Messages block (or the
   * Details card's messages ribbon) is placed.
   */
  messagesAt?: MessagesAt;
}) {
  const audience = useContext(PreviewAudience);
  const p = useWalkParts();
  const atTop = messagesAt !== "block";
  const messages =
    p && atTop ? (
      <MessagesOrSample
        className={cn(
          messagesAt === "strip" &&
            "-mx-4 -mt-6 gap-0 md:-mx-6 [&_[data-slot=alert]]:rounded-none [&_[data-slot=alert]]:border-x-0 [&_[data-slot=alert]]:border-t-0 [&_[data-slot=alert]]:px-4 md:[&_[data-slot=alert]]:px-6 [&>div]:gap-0",
          MESSAGE_LOOK[messagesLook],
        )}
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
}: {
  children: ReactNode;
  layout?: BlockLayout;
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
      className={cn(
        "flex flex-col",
        // Blocks sit 24px apart; these pull a block closer or push it away.
        // The page starts 24px under the header; this cancels it.
        spaceAbove === "header" && "-mt-6",
        spaceAbove === "closer" && "-mt-3",
        spaceAbove === "more" && "mt-4",
        spaceAbove === "lots" && "mt-12",
        spaceBelow === "closer" && "-mb-3",
        spaceBelow === "more" && "mb-4",
        spaceBelow === "lots" && "mb-12",
        buttons === "phones" &&
          "max-sm:[&_[data-slot=button]]:w-full max-sm:[&_[data-slot=button]]:flex-1",
        buttons === "always" &&
          "[&_[data-slot=button]]:w-full [&_[data-slot=button]]:flex-1",
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
      const wrapped: ComponentConfig = {
        ...component,
        fields: { ...component.fields, layout: blockLayoutField },
        defaultProps: { ...component.defaultProps, layout: BLOCK_LAYOUT },
        render: (props: Record<string, unknown>) => (
          <BlockFrame layout={props.layout as BlockLayout | undefined}>
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
      fields: {
        factsAs: {
          type: "select",
          label: "Facts shown as",
          options: [
            { value: "facts", label: "The facts (looks below)" },
            {
              value: "ticket",
              label: "Walk ticket (has its own name and buttons)",
            },
            {
              value: "ticket-colour",
              label: "Colour walk ticket (own name and buttons)",
            },
            { value: "colour-blocks", label: "Colour blocks" },
            {
              value: "bento",
              label: "Bento grid (has its own name and buttons)",
            },
            { value: "story-cards", label: "Story cards" },
            { value: "badges", label: "Round badges" },
            { value: "summary", label: "Summary tiles" },
            { value: "stat-cards", label: "Stat cards (big values)" },
            { value: "icon-circles", label: "Icons in coloured circles" },
            { value: "spec-sheet", label: "Spec sheet (striped table)" },
            { value: "receipt", label: "Receipt (dotted lines)" },
            { value: "sticky-notes", label: "Sticky notes" },
            { value: "journey", label: "Journey line (dots, swipe)" },
            { value: "numbered", label: "Numbered list" },
            { value: "top-bar", label: "Cards with a coloured top bar" },
            { value: "columns", label: "Columns with dividers" },
            { value: "big-first", label: "First fact big, the rest in a line" },
            { value: "vertical-timeline", label: "Vertical timeline" },
            { value: "big-pills", label: "Big pills (label and value)" },
            { value: "two-tone-rows", label: "Two-tone rows (green labels)" },
            { value: "mini-cards", label: "Mini cards (compact)" },
            { value: "none", label: "Don't show facts" },
          ],
        },
        facts: {
          type: "select",
          label: "Facts on computers",
          options: factsOptions,
        },
        factsArrange: { ...arrangeField, label: "Facts arrange on computers" },
        phoneFacts: {
          type: "select",
          label: "Facts on phones",
          options: phoneFactsOptions,
        },
        phoneFactsArrange: {
          ...phoneArrangeField,
          label: "Facts arrange on phones",
        },
        tabletFacts: {
          type: "select",
          label: "Facts on tablets",
          options: tabletFactsOptions,
        },
        tabletFactsArrange: {
          ...tabletArrangeField,
          label: "Facts arrange on tablets",
        },
        showEmptyFacts: showEmptyField,
        titleLook: {
          type: "select",
          label: "Title look",
          options: [
            { value: "standard", label: "Standard (options below)" },
            ...TITLE_LOOKS.map(([value, label]) => ({ value, label })),
          ],
        },
        titleBox: boxField("Box around the title (name, status, Manage)"),
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
          ],
        },
        factsTitle: {
          type: "text",
          label: "Facts heading (blank: no heading)",
        },
        timelineTitle: {
          type: "text",
          label: "Timeline heading (blank: no heading)",
        },
        factLines: { ...factLinesField, label: "Lines in the facts list" },
        factsBox: boxField("Box around the facts (computers)"),
        tabletFactsBox: tabletBoxField("Box around the facts (tablets)"),
        phoneFactsBox: phoneBoxField("Box around the facts (phones)"),
        timelineBox: boxField("Box around the day's timeline"),
        descriptionAt: {
          type: "radio",
          label: "Description position",
          options: options([
            ["own", "On its own"],
            ["title", "In the title box (under Created by)"],
          ]),
        },
        descriptionTitle: {
          type: "text",
          label: "Description heading (blank: no heading)",
        },
        descriptionBox: boxField("Box around the description"),
        essentials: {
          type: "object",
          label: "Essentials in the card",
          objectFields: essentialsFields,
        },
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
        mapButtonsLook: {
          ...directionsLookField,
          label: "Map's directions buttons look",
        },
        mapCorners: {
          ...cornersField,
          label: "Map corners",
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
        mapHeight: {
          type: "radio",
          label: "Map height",
          options: options([
            ["short", "Short"],
            ["medium", "Medium"],
            ["tall", "Tall"],
          ]),
        },
        tone: {
          type: "select",
          label: "Card frame",
          options: options([
            ["card", "Card (border and shadow)"],
            ["tint", "Light grey card"],
            ["plain", "No card"],
          ]),
        },
        showTitle: { type: "radio", label: "Show the title", options: yesNo },
        showActions: {
          type: "radio",
          label: "Clock in + Manage",
          options: yesNo,
        },
        showEssentials: { type: "radio", label: "Essentials", options: yesNo },
        showDescription: {
          type: "radio",
          label: "Description",
          options: yesNo,
        },
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
        timeline: {
          type: "radio",
          label: "The day's timeline",
          options: yesNo,
        },
        bigTitle: { type: "radio", label: "Big title", options: yesNo },
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
        titleBox: "none",
        titleMessages: "none",
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
        titleBox,
        titleMessages,
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
          titleBox={titleBox}
          titleMessages={titleMessages}
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
          tone={tone}
        />
      ),
    },
    Facts: {
      label: "Facts",
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
      }) => (
        <FactsBlock
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
    Timeline: { label: "The day's timeline", render: () => <TimelineBlock /> },
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
      fields: { arrange: arrangeField },
      defaultProps: { arrange: "fill" },
      render: ({ arrange }) => <SummaryTilesBlock arrange={arrange} />,
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
            ["callout", "Green callout"],
            ["tiles", "Numbered tiles"],
            ["swipe", "Tiles in one swiping row"],
            ["compact", "One short line"],
          ]),
        },
        title: {
          type: "text",
          label: "Heading (blank: How this group works)",
        },
      },
      defaultProps: { look: "card", title: "" },
      render: ({ look, title, puck }) => (
        <HowItWorksBlock
          editing={Boolean(puck?.isEditing)}
          look={look}
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
            ["callout", "Green callout"],
            ["tiles", "Numbered tiles"],
            ["swipe", "Tiles in one swiping row"],
            ["compact", "One short paragraph"],
          ]),
        },
        title: { type: "text", label: "Heading (blank: Before you set off)" },
      },
      defaultProps: { look: "card", title: "" },
      render: ({ look, title }) => <BeforeBlock look={look} title={title} />,
    },
    Attended: { label: "Attended", render: () => <AttendedBlock /> },
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
          { value: "strip", label: "Full-width strip under the header" },
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
