"use client";

import type { ComponentConfig, Config } from "@puckeditor/core";
import { useContext, type ReactNode } from "react";
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
const phoneArrangeField = {
  type: "radio" as const,
  label: "On phones: arrange",
  options: [
    { value: "same", label: "Same as on computers" },
    { value: "fill", label: "Fill the width" },
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

const arrangeField = {
  type: "radio" as const,
  label: "Arrange",
  options: options<Arrange>([
    ["fill", "Fill the width"],
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
  showOn?: "all" | "phones" | "computers";
  buttons?: "as-is" | "phones" | "always";
  shadows?: "keep" | "none";
  messages?: MessageLook;
  boxes?: BoxLook;
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
        ["computers", "Computers only"],
      ]),
    },
  },
};

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
  const { width, frame, heading, showOn, buttons, shadows, messages, boxes } = {
    ...BLOCK_LAYOUT,
    ...layout,
  };
  const full = width !== "page";
  const framed = frame !== "none";
  return (
    <div
      data-bleed={width === "full" ? "" : undefined}
      className={cn(
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
        showOn === "phones" && "md:hidden",
        showOn === "computers" && "max-md:hidden",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-col gap-3",
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
        facts: { type: "select", label: "Facts", options: factsOptions },
        factsArrange: { ...arrangeField, label: "Facts arrange" },
        phoneFacts: {
          type: "select",
          label: "Facts on phones",
          options: phoneFactsOptions,
        },
        phoneFactsArrange: {
          ...phoneArrangeField,
          label: "Facts arrange on phones",
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
        variant: { type: "select", label: "Look", options: factsOptions },
        arrange: arrangeField,
        phoneVariant: {
          type: "select",
          label: "On phones: look",
          options: phoneFactsOptions,
        },
        phoneArrange: phoneArrangeField,
      },
      defaultProps: {
        variant: "grid",
        arrange: "fill",
        phoneVariant: "same",
        phoneArrange: "same",
      },
      render: ({ variant, arrange, phoneVariant, phoneArrange }) => (
        <FactsBlock
          arrange={arrange}
          phoneArrange={phoneArrange}
          phoneVariant={phoneVariant}
          variant={variant}
        />
      ),
    },
    Essentials: { label: "Essentials", render: () => <EssentialsBlock /> },
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
    Before: { label: "Before you set off", render: () => <BeforeBlock /> },
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
        stickySecond: {
          type: "radio",
          label: "Right column stays in view",
          options: yesNo,
        },
        left: { type: "slot" },
        right: { type: "slot" },
        third: { type: "slot" },
      },
      defaultProps: {
        ratio: "2:1",
        stickySecond: false,
        left: [],
        right: [],
        third: [],
      },
      render: ({
        ratio,
        stickySecond,
        left: Left,
        right: Right,
        third: Third,
      }) => (
        <div
          className={cn(
            "grid gap-6",
            ratio === "1:1" && "lg:grid-cols-2",
            ratio === "2:1" && "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
            ratio === "1:2" && "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]",
            ratio === "1:1:1" && "lg:grid-cols-3",
          )}
        >
          <Left className="flex min-w-0 flex-col gap-6" />
          <Right
            className={cn(
              "flex min-w-0 flex-col gap-6",
              stickySecond && "lg:sticky lg:top-24 lg:self-start",
            )}
          />
          {ratio === "1:1:1" ? (
            <Third className="flex min-w-0 flex-col gap-6" />
          ) : null}
        </div>
      ),
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
        fit: "fill",
        sticky: true,
        tabs: [
          { label: "Map & weather", content: [] },
          { label: "Attended", content: [] },
          { label: "Journey", content: [] },
        ],
      },
      render: ({ style, bar: barWidth, fit, sticky, tabs, puck }) => {
        // In the designer every tab's area is shown, one under another, so
        // blocks can be dropped into any tab (a hidden tab can't be reached).
        const editing = Boolean(puck?.isEditing);
        const list = (tabs ?? []) as {
          label: string;
          content: (props: { className?: string }) => React.ReactNode;
        }[];
        if (list.length === 0) return <></>;
        const bar = (
          <Tabs defaultValue="tab-0">
            {/* Full width; on a phone the names scroll sideways rather than squashing. */}
            <div
              className={cn(
                sticky &&
                  "sticky top-16 z-20 -mx-1 bg-background/95 px-1 py-2 backdrop-blur-sm",
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
                {list.map((tab, i) => (
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
                  className="mt-4 flex flex-col gap-2 rounded-xl border border-dashed p-3"
                  key={i}
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    Tab {i + 1}: {tab.label} (drop its blocks here)
                  </span>
                  <Content className="flex min-h-16 flex-col gap-6" />
                </div>
              ) : (
                <TabsContent className="mt-4" key={i} value={`tab-${i}`}>
                  <Content className="flex flex-col gap-6" />
                </TabsContent>
              );
            })}
          </Tabs>
        );
        // "The site's tab style" follows Settings; the others set this bar's own.
        return style && style !== "site" ? (
          <TabStyleProvider style={style as TabStyle}>{bar}</TabStyleProvider>
        ) : (
          bar
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
