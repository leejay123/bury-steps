"use client";

import type { ComponentConfig, Config } from "@puckeditor/core";
import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { PreviewAudience } from "./parts";
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
  type TitleVariant,
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

/** Inside an edge-to-edge block, lose the rounded corners and side borders. */
const BLEED = "in-data-[bleed]:rounded-none in-data-[bleed]:border-x-0";

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
  heading: {
    type: "radio" as const,
    label: "“Essentials” heading",
    options: yesNo,
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
  heading: true,
  showEmpty: false,
};
const spaceOptions = options([
  ["none", "None"],
  ["small", "Small"],
  ["medium", "Medium"],
  ["large", "Large"],
]);
const GAP: Record<string, string> = {
  none: "gap-0",
  small: "gap-3",
  medium: "gap-6",
  large: "gap-10",
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
 * Options every block has, under "Block layout": how wide it goes (out to
 * the page's edges, like the homepage's full-width sections), a frame
 * around it, a heading above it, and whether it shows on phones,
 * computers or both. Puck has no shared fields of its own, so they're added
 * to each block here (withBlockLayout).
 */
type BlockLayout = {
  width?: "page" | "full" | "full-inset";
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
  spaceAbove?: "closer" | "normal" | "more" | "lots";
  spaceBelow?: "closer" | "normal" | "more" | "lots";
};
const BLOCK_LAYOUT: BlockLayout = {
  width: "page",
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
    width: {
      type: "select" as const,
      label: "Width",
      options: options([
        ["page", "Page width"],
        ["full", "Full width, edge to edge"],
        ["full-inset", "Full-width background, content in line with the page"],
      ]),
    },
    frame: {
      type: "select" as const,
      label: "Frame",
      options: options([
        ["none", "None"],
        ["card", "Card"],
        ["tint", "Light grey"],
        ["outline", "Outline only"],
        ["dark", "Dark"],
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
  barWidth,
  fit,
  contentSpace = "small",
  innerSpace = "medium",
}: {
  list: TabItem[];
  editing: boolean;
  sticky?: boolean;
  corners?: string;
  barWidth?: string;
  fit?: string;
  contentSpace?: string;
  innerSpace?: string;
}) {
  // Between the tab bar and the content (it had 16px), and between blocks in a tab.
  const below =
    { none: "mt-0", small: "mt-4", medium: "mt-6", large: "mt-10" }[
      contentSpace
    ] ?? "mt-4";
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
    <Tabs onValueChange={setValue} value={active}>
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
          barWidth === "full" &&
            "-mx-4 px-0 md:-mx-6 [&_[data-slot=tabs-list]]:rounded-none",
        )}
      >
        <TabsList
          className={cn(
            "max-w-full justify-start overflow-x-auto [scrollbar-width:none] [&>*]:flex-none",
            fit === "fill" && "w-full sm:[&>*]:flex-1",
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
function PageRoot({ children }: { children: ReactNode }) {
  const audience = useContext(PreviewAudience);
  return (
    <div
      className="flex flex-col gap-6"
      data-preview-audience={audience ?? undefined}
    >
      {children}
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
    width,
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
  const full = width !== "page";
  const framed = frame !== "none";
  return (
    <div
      data-bleed={width === "full" ? "" : undefined}
      className={cn(
        "flex flex-col",
        // Blocks sit 24px apart; these pull a block closer or push it away.
        spaceAbove === "closer" && "-mt-3",
        spaceAbove === "more" && "mt-4",
        spaceAbove === "lots" && "mt-12",
        spaceBelow === "closer" && "-mb-3",
        spaceBelow === "more" && "mb-4",
        spaceBelow === "lots" && "mb-12",
        full && "-mx-4 md:-mx-6",
        // Edge to edge: cards inside lose their rounded corners and side borders.
        width === "full" &&
          "[&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:border-x-0",
        buttons === "phones" &&
          "max-sm:[&_[data-slot=button]]:w-full max-sm:[&_[data-slot=button]]:flex-1",
        buttons === "always" &&
          "[&_[data-slot=button]]:w-full [&_[data-slot=button]]:flex-1",
        shadows === "none" && "[&_*]:shadow-none",
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
          framed && "py-5",
          framed && !full && "rounded-2xl px-5 sm:px-6",
          framed && full && "border-x-0",
          width === "full-inset" && "px-4 md:px-6",
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
      render: ({ look }) => <MessagesBlock look={look} />,
    },
    Title: {
      label: "Title",
      fields: {
        variant: {
          type: "select",
          label: "Look",
          options: options<TitleVariant>([
            ["plain", "Plain"],
            ["chips", "With fact chips"],
            ["stats", "Big name and four key facts"],
            ["band", "Status band"],
            ["magazine", "Magazine"],
            ["poster", "Poster"],
            ["trailhead", "Trailhead sign"],
            ["dark", "Dark band"],
            ["calendar", "Calendar date"],
            ["split", "Coloured time block"],
            ["contours", "Contour lines"],
            ["typographic", "Huge start time"],
          ]),
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
            ["top", "Along the top, edge to edge"],
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
          label: "Look",
          options: options([
            ["card", "Card"],
            ["tint", "Tinted"],
            ["dark", "Dark"],
            ["plain", "No border"],
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
        facts: "grid",
        factsArrange: "fill",
        map: "none",
        mapButtons: "below",
        mapHeight: "medium",
        mapTitle: true,
        mapNote: true,
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
        essentials: ESSENTIALS_DEFAULTS,
        timeline: false,
        bigTitle: false,
      },
      render: ({
        facts,
        factsArrange,
        map,
        mapButtons,
        mapHeight,
        mapTitle,
        mapNote,
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
        timeline,
        bigTitle,
      }) => (
        <DetailsBlock
          bigTitle={bigTitle}
          facts={facts}
          factsArrange={factsArrange}
          map={map}
          mapButtons={mapButtons}
          mapHeight={mapHeight}
          mapNote={mapNote}
          mapTitle={mapTitle}
          phoneFacts={phoneFacts}
          phoneFactsArrange={phoneFactsArrange}
          tabletFacts={tabletFacts}
          tabletFactsArrange={tabletFactsArrange}
          showEmptyFacts={showEmptyFacts}
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
      },
      defaultProps: {
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
      }) => (
        <FactsBlock
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
        showEmpty,
      }) => (
        <EssentialsBlock
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
    Description: { label: "Description", render: () => <DescriptionBlock /> },
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
      render: ({ puck }) => (
        <HowItWorksBlock editing={Boolean(puck?.isEditing)} />
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
            ["flat", "Flat, no frame (edge to edge in a full-width block)"],
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
      },
      defaultProps: {
        look: "card",
        buttons: "below",
        height: "medium",
        showTitle: true,
        showNote: true,
      },
      render: ({ look, buttons, height, showTitle, showNote }) => (
        <MapBlock
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
      },
      defaultProps: { full: false },
      render: ({ full }) => <DirectionsBlock full={full} />,
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
        width: {
          type: "radio",
          label: "Width",
          options: options([
            ["contained", "Page width"],
            ["full", "Full width, edge to edge"],
            [
              "full-inset",
              "Full-width background, content in line with the page",
            ],
          ]),
        },
        background: {
          type: "select",
          label: "Background",
          options: options([
            ["none", "None"],
            ["muted", "Light grey"],
            ["dark", "Dark"],
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
        width: "contained",
        background: "none",
        padding: "none",
        content: [],
      },
      render: ({ width, background, padding, content: Content }) => (
        <section
          data-bleed={width === "full" ? "" : undefined}
          className={cn(
            width !== "contained" && "-mx-4 md:-mx-6",
            width === "full-inset" && "px-4 md:px-6",
            width === "full" &&
              "[&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:border-x-0",
            background === "muted" && "bg-muted/50",
            background === "dark" && "bg-neutral-950 text-white",
            background === "green" && "bg-emerald-900 text-emerald-50",
            background !== "none" &&
              width === "contained" &&
              "rounded-2xl px-4 sm:px-6",
            padding === "small" && "py-4",
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
        gap: "medium",
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
              GAP[gap ?? "medium"] ?? "gap-6",
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
                <SidebarContent className="flex flex-col gap-4" />
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
                <SidebarContent className="flex flex-col gap-4" />
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
            ["dark", "Dark"],
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
            BLEED,
            tone === "card" && "border bg-card shadow-sm",
            tone === "tint" && "bg-muted/40",
            tone === "dark" && "bg-neutral-950 text-white",
            tone === "outline" && "border",
          )}
        >
          <Content className="flex flex-col gap-5 p-5 sm:p-6" />
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
        bar: {
          type: "radio",
          label: "Tab bar width",
          options: options([
            ["page", "Page width"],
            ["full", "Full width, edge to edge"],
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
        bar: "page",
        corners: "as-is",
        contentSpace: "small",
        innerSpace: "medium",
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
        bar: barWidth,
        corners,
        contentSpace,
        innerSpace,
        fit,
        sticky,
        tabs,
        puck,
      }) => {
        const view = (
          <TabsView
            barWidth={barWidth}
            contentSpace={contentSpace}
            corners={corners}
            innerSpace={innerSpace}
            // In the designer every tab's area is shown, one under another,
            // so blocks can be dropped into any tab.
            editing={Boolean(puck?.isEditing)}
            fit={fit}
            list={(tabs ?? []) as TabItem[]}
            sticky={sticky}
          />
        );
        // "The site's tab style" follows Settings; the others set this bar's own.
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
            className={cn("rounded-2xl border px-4", BLEED)}
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
                    <Content className="flex flex-col gap-4" />
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
  root: {
    render: ({ children }: { children: React.ReactNode }) => (
      <PageRoot>{children}</PageRoot>
    ),
  },
};
