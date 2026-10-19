import type { Data } from "@puckeditor/core";
import { READY_LAYOUTS } from "./ready-layouts";

/**
 * Ready-made starting designs for the walk page designer, each following the
 * agreed rules: the title, essentials and every detail
 * at the top, then the rest. A walk page uses the first one until a design
 * is saved; the designer offers them all to start from.
 */

let counter = 0;
type Block = { type: string; props: Record<string, unknown> };
const block = (type: string, props: Record<string, unknown> = {}): Block => ({
  type,
  props: { id: `${type}-preset-${++counter}`, ...props },
});

const tabs = (items: [string, Block[]][]) =>
  block("Tabs", {
    sticky: true,
    tabs: items.map(([label, content]) => ({ label, content })),
  });

const restTabs = (mapInCard: boolean) =>
  tabs([
    [
      mapInCard ? "Weather" : "Map & weather",
      mapInCard
        ? [block("Weather"), block("Precise")]
        : [block("Map"), block("Weather"), block("Precise")],
    ],
    ["Before you set off", [block("Before")]],
    ["Attended", [block("Attended")]],
    ["Journey", [block("Journey")]],
  ]);

// Every ready-made design starts with the Back link block (move or remove it in the designer).
const page = (content: Block[]): Data => ({
  root: { props: {} },
  content: [block("BackLink"), ...content] as Data["content"],
});

export const WALK_DESIGN_PRESETS: {
  id: string;
  label: string;
  data: () => Data;
}[] = [
  {
    id: "map-card-tabs",
    label: "Details with the map in the card, sticky tabs",
    data: () =>
      page([
        block("ClockIn"),
        block("Details", { map: "top", facts: "grid" }),
        restTabs(true),
      ]),
  },
  {
    id: "map-side-tabs",
    label: "Map down the side of the card, sticky tabs",
    data: () =>
      page([
        block("ClockIn"),
        block("Details", { map: "side", facts: "list" }),
        restTabs(true),
      ]),
  },
  {
    id: "status-first",
    label: "Status box, title with chips, details, tabs",
    data: () =>
      page([
        block("ClockIn"),
        block("Status", { variant: "box" }),
        block("Title", { variant: "chips" }),
        block("Details", {
          showTitle: false,
          showActions: false,
          facts: "list",
        }),
        restTabs(false),
      ]),
  },
  {
    id: "sidebar",
    label: "Details card, people and journey in a sidebar",
    data: () =>
      page([
        block("ClockIn"),
        block("Details", { map: "top", facts: "grid" }),
        block("Sidebar", {
          side: "right",
          label: "People & journey",
          sticky: true,
          sidebar: [block("Attended"), block("Journey")],
          main: [block("Weather"), block("Precise"), block("Before")],
        }),
      ]),
  },
  {
    id: "full-width-map",
    label: "Map, details, folding sections",
    data: () =>
      page([
        block("ClockIn"),
        block("Details", { facts: "grid" }),
        block("Map"),
        block("Folding", {
          items: [
            {
              label: "Weather",
              open: true,
              content: [block("Weather"), block("Precise")],
            },
            {
              label: "Before you set off",
              open: false,
              content: [block("Before")],
            },
            { label: "Attended", open: false, content: [block("Attended")] },
            { label: "Journey", open: false, content: [block("Journey")] },
          ],
        }),
      ]),
  },
  {
    id: "dashboard",
    label: "Big numbers, details and attended side by side",
    data: () =>
      page([
        block("ClockIn"),
        block("Title", { variant: "plain" }),
        block("Status", { variant: "numbers" }),
        block("Columns", {
          ratio: "1:1",
          stickySecond: true,
          left: [
            block("Details", {
              showTitle: false,
              showActions: false,
              facts: "table",
            }),
            block("Map"),
            block("Weather"),
          ],
          right: [block("Attended"), block("Journey")],
        }),
      ]),
  },
];

export const DEFAULT_WALK_DESIGN = () => WALK_DESIGN_PRESETS[0].data();

/** Where a new design starts: visitors' also has How this group works under the details. */
export const defaultDesignFor = (
  audience: "organiser" | "member" | "visitor",
): Data =>
  audience === "visitor"
    ? page([
        block("Details", { map: "top", facts: "grid" }),
        block("HowItWorks"),
        restTabs(true),
      ])
    : DEFAULT_WALK_DESIGN();

/**
 * A ready-made page for every numbered design (1–81): the Back link, then
 * that design whole in a Ready-made layout block. Add blocks around it, or
 * swap the design in the block's options.
 */
export const READY_PAGE_PRESETS: {
  id: string;
  label: string;
  group: string;
  data: () => Data;
}[] = READY_LAYOUTS.map((item) => ({
  id: `ready-${item.id}`,
  label: `${item.number} · ${item.label}`,
  group: item.group,
  data: () => page([block("ReadyLayout", { layout: item.id })]),
}));
