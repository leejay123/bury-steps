"use client";

import type { ComponentConfig, Config } from "@puckeditor/core";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FactBlock,
  StatusBadgeBlock,
  TimelineBlock,
  WalkNameBlock,
  FACT_NAMES,
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
  ["list", "Two-column list with lines"],
  ["table", "One-column table"],
  ["inline", "One line of icons"],
  ["chips", "Grey chips"],
  ["tiles", "Tiles"],
]);

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
};
const BLOCK_LAYOUT: BlockLayout = {
  width: "page",
  frame: "none",
  heading: "",
  showOn: "all",
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

function BlockFrame({
  children,
  layout,
}: {
  children: ReactNode;
  layout?: BlockLayout;
}) {
  const { width, frame, heading, showOn } = { ...BLOCK_LAYOUT, ...layout };
  const full = width !== "page";
  const framed = frame !== "none";
  return (
    <div
      className={cn(
        full && "-mx-4 md:-mx-6",
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
      components: ["Map", "Weather", "Precise", "Before"],
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
      render: () => <MessagesBlock />,
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
        ribbon: { type: "radio", label: "Status ribbon", options: yesNo },
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
        tone: "card",
        showTitle: true,
        showActions: true,
        showEssentials: true,
        showDescription: true,
        ribbon: false,
        timeline: false,
        bigTitle: false,
      },
      render: ({
        facts,
        factsArrange,
        map,
        tone,
        showTitle,
        showActions,
        showEssentials,
        showDescription,
        ribbon,
        timeline,
        bigTitle,
      }) => (
        <DetailsBlock
          bigTitle={bigTitle}
          facts={facts}
          factsArrange={factsArrange}
          map={map}
          ribbon={ribbon}
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
      },
      defaultProps: { variant: "grid", arrange: "fill" },
      render: ({ variant, arrange }) => (
        <FactsBlock arrange={arrange} variant={variant} />
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
      render: () => <HowItWorksBlock />,
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
    Map: { label: "Map", render: () => <MapBlock /> },
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
          className={cn(
            width === "full" && "-mx-4 px-4 md:-mx-6 md:px-6",
            background === "muted" && "bg-muted/50",
            background === "dark" && "bg-neutral-950 text-white",
            background === "green" && "bg-emerald-900 text-emerald-50",
            background !== "none" &&
              width !== "full" &&
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
        sticky: true,
        tabs: [
          { label: "Map & weather", content: [] },
          { label: "Attended", content: [] },
          { label: "Journey", content: [] },
        ],
      },
      render: ({ sticky, tabs }) => {
        const list = (tabs ?? []) as {
          label: string;
          content: (props: { className?: string }) => React.ReactNode;
        }[];
        if (list.length === 0) return <></>;
        return (
          <Tabs defaultValue="tab-0">
            {/* Full width; on a phone the names scroll sideways rather than squashing. */}
            <div
              className={cn(
                sticky &&
                  "sticky top-16 z-20 -mx-1 bg-background/95 px-1 py-2 backdrop-blur-sm",
              )}
            >
              <TabsList className="w-full justify-start overflow-x-auto [scrollbar-width:none] [&>*]:flex-none sm:[&>*]:flex-1">
                {list.map((tab, i) => (
                  <TabsTrigger key={i} value={`tab-${i}`}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {list.map((tab, i) => {
              const Content = tab.content;
              return (
                <TabsContent className="mt-4" key={i} value={`tab-${i}`}>
                  <Content className="flex flex-col gap-6" />
                </TabsContent>
              );
            })}
          </Tabs>
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
      render: ({ items }) => {
        const list = (items ?? []) as {
          label: string;
          open: boolean;
          content: (props: { className?: string }) => React.ReactNode;
        }[];
        return (
          <Accordion
            className="rounded-2xl border px-4"
            defaultValue={list.flatMap((item, i) =>
              item.open ? [`item-${i}`] : [],
            )}
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
      <div className="flex flex-col gap-6">{children}</div>
    ),
  },
};
