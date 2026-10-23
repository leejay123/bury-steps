"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  CloudSun,
  Coffee,
  Flag,
  Footprints,
  MapPin,
  Mountain,
  Navigation,
  PanelLeft,
  Timer,
  TrendingUp,
  UserRound,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { formatTime, formatWalkDay, formatWalkLength } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { DataList, DataListItem } from "@/components/data-list";
import { AttendedRuleContext, type AttendedRule } from "./attended-rule";
import { keptFactsAs, titlePartsOf, type TitlePart } from "./design-rules";
export { keptFactsAs, titlePartsOf, type TitlePart };
import { effectiveEndsAt, walkOpensAt, walkStatus } from "@/lib/walk-window";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShareLinkButton } from "@/components/share-link";
import { WalkDescription } from "@/components/walk-description";
import { useWalkEssentials } from "@/components/walk-essentials-context";
import { essentialIcon, walkEssentialItems } from "@/lib/walk-essentials";
import { useWalkNow } from "@/components/walk-header-styles";
import { useWalkWording } from "@/components/walk-wording-context";
import { walkCountdown } from "@/lib/walk-wording";
import type { WalkIdeaParts } from "@/components/walk-idea-layouts";
import { WalkActionsBar, WalkManageMenu } from "@/components/walk-manage-menu";
import { WalkStatusBadge } from "@/components/walk-status-badge";
import { What3wordsLink } from "@/components/what3words-link";
import { what3wordsUrl } from "@/lib/what3words";
import {
  DirectionsButtons,
  MapLookProvider,
  type DirectionsLook,
  type MapLook,
} from "@/components/walk-map";
import { useWalkParts } from "./parts";

/**
 * The blocks of the walk page designer (Settings → Walk page designer):
 * every piece of the walk page designs, each with the looks those designs
 * had as variants to choose from. They read the walk from WalkPartsProvider;
 * in the designer, with no walk, they show a short label instead.
 */

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
type Fact = { icon: Icon; label: string; value: string; wide?: boolean };

/** The walk's times, facts and live status, worked out once for the blocks. */
function useWalkInfo(p: WalkIdeaParts, showEmpty = false) {
  const clock = useWalkClock(p.timing);
  const words = useWalkWording();
  const now = useWalkNow(p.timing, p.attended?.count ?? null);
  const h = p.headline;
  const start = new Date(h.startsAt);
  const end = effectiveEndsAt({
    durationMins: p.timing.durationMins,
    endedAt: p.timing.endedAt ? new Date(p.timing.endedAt) : null,
    startsAt: start,
  });
  const opens = walkOpensAt(start);
  const status = walkStatus(
    {
      cancelledAt: p.timing.cancelledAt ? new Date(p.timing.cancelledAt) : null,
      durationMins: p.timing.durationMins,
      endedAt: p.timing.endedAt ? new Date(p.timing.endedAt) : null,
      startsAt: start,
    },
    clock,
  );
  const organiser = Boolean(p.tools);
  const facts: Fact[] = [
    { icon: CalendarDays, label: "Date", value: formatWalkDay(start) },
    { icon: Clock, label: "Starts", value: formatTime(start) },
    { icon: Flag, label: "Finishes", value: formatTime(end) },
    { icon: Timer, label: "Length", value: formatWalkLength(h.durationMins) },
    ...[
      { icon: MapPin, label: "Meeting point", value: p.meeting, wide: true },
      {
        icon: Navigation,
        label: "what3words",
        // Break opportunities after "///" and each dot (zero-width spaces),
        // so the address wraps at its dots instead of spilling out of a tile.
        value: p.what3words
          ? `///\u200B${p.what3words.replaceAll(".", ".\u200B")}`
          : null,
      },
      { icon: Footprints, label: "Distance", value: h.distance },
      { icon: Mountain, label: "Climb", value: h.elevationGain },
      { icon: TrendingUp, label: "Grade", value: h.grade },
      { icon: UserRound, label: "Walk leader", value: h.walkLeader },
      { icon: UsersRound, label: "Back marker", value: p.walk.backMarker },
      {
        icon: Coffee,
        label: "Refreshment stop",
        value: p.walk.refreshmentStop,
        wide: true,
      },
    ].flatMap((fact) =>
      // Empty facts are left out, unless the design asks to show organisers
      // "Not set" (to spot what's missing from Edit walk).
      fact.value
        ? [{ ...fact, value: fact.value }]
        : organiser && showEmpty
          ? [{ ...fact, value: "Not set" }]
          : [],
    ),
  ];
  const minsLeft = Math.max(
    0,
    Math.round((end.getTime() - clock.getTime()) / 60_000),
  );
  const minsToStart = Math.max(
    0,
    Math.round((start.getTime() - clock.getTime()) / 60_000),
  );
  const countdown = walkCountdown(words, status, minsToStart, minsLeft);
  const progress = Math.min(
    100,
    Math.max(
      0,
      ((clock.getTime() - opens.getTime()) /
        (end.getTime() - opens.getTime())) *
        100,
    ),
  );
  return {
    clock,
    now,
    start,
    end,
    opens,
    status,
    organiser,
    facts,
    countdown,
    progress,
  };
}

/** In the designer with no walk to show: a labelled outline of the block's place. */
function Placeholder({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function withParts(label: string, render: (p: WalkIdeaParts) => ReactNode) {
  return function Block() {
    const p = useWalkParts();
    return p ? <>{render(p)}</> : <Placeholder label={label} />;
  };
}

// ── Small shared pieces ─────────────────────────────────────────────────
function Badge({ p, className }: { p: WalkIdeaParts; className?: string }) {
  const h = p.headline;
  return (
    <WalkStatusBadge
      cancelledAt={h.cancelledAt}
      className={cn("shrink-0", className)}
      durationMins={h.durationMins}
      endedAt={h.endedAt}
      startsAt={h.startsAt}
    />
  );
}

function StatusLine({
  p,
  className,
  withEyebrow = true,
}: {
  p: WalkIdeaParts;
  className?: string;
  /** Off beside the status badge, which already says it (no "In progress" twice). */
  withEyebrow?: boolean;
}) {
  const { now } = useWalkInfo(p);
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
      suppressHydrationWarning
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          now.live ? "bg-emerald-500" : "bg-muted-foreground/40",
        )}
      />
      {withEyebrow ? `${now.eyebrow} · ${now.line}` : now.line}
    </span>
  );
}

/** Clock in (while it can be used) and one Manage list; members get Share or save. */
export function Actions({
  p,
  className,
}: {
  p: WalkIdeaParts;
  className?: string;
}) {
  if (p.share || p.tools)
    return (
      <WalkActionsBar
        className={className}
        liveCompact={p.liveCompact}
        share={p.share}
        tools={p.tools}
      />
    );
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center",
        className,
      )}
    >
      {/* Members: Clock in / Clock out (designed pages), beside it. */}
      {p.liveCompact}
      <WalkManageMenu label="Share or save">
        <ShareLinkButton url={p.walk.shareUrl} />
        <Button asChild size="sm" variant="outline">
          <a download href={p.walk.calendarHref}>
            <CalendarPlus data-icon="inline-start" />
            Add to calendar
          </a>
        </Button>
      </WalkManageMenu>
    </div>
  );
}

/**
 * "fill": rows that always reach the edge (a short last row stretches, so
 * there's never a gap); "grid": an even grid whose columns line up;
 * "scroll": one row that swipes sideways.
 */
/** The space between facts (story cards, tiles, badges…), as the --facts-gap the looks read. */
export type FactsGap = "none" | "tight" | "closer" | "normal" | "more" | "lots";
export const FACTS_GAP: Record<FactsGap, string> = {
  none: "0px",
  tight: "0.5rem",
  closer: "0.75rem",
  normal: "1.5rem",
  more: "2rem",
  lots: "3rem",
};
export const factsGapStyle = (gap?: FactsGap) =>
  ({ "--facts-gap": FACTS_GAP[gap ?? "normal"] }) as React.CSSProperties;

export type Arrange = "fill" | "grid" | "scroll" | "carousel";

/**
 * One row that swipes sideways (or a carousel, with ‹ › buttons) for any
 * look: its list's items sit side by side, each a fixed width, snapping into
 * place. The rule is put on the list from outside, so every look (tables
 * and timelines too) can do it without its own version.
 */
export function ScrollRow({
  carousel = false,
  natural = false,
  children,
}: {
  carousel?: boolean;
  /** The list already swipes and sizes its own items; only add the buttons. */
  natural?: boolean;
  children: ReactNode;
}) {
  const row = useRef<HTMLDivElement>(null);
  const move = (direction: 1 | -1) => {
    const list = row.current?.firstElementChild as HTMLElement | null;
    list?.scrollBy({
      left: direction * list.clientWidth * 0.8,
      behavior: "smooth",
    });
  };
  return (
    <div className="flex flex-col gap-3">
      <div
        className={
          natural
            ? undefined
            : "[&>*]:flex! [&>*]:flex-row! [&>*]:flex-nowrap! [&>*]:snap-x [&>*]:gap-[var(--facts-gap,1.5rem)]! [&>*]:overflow-x-auto [&>*]:pb-1 [&>*]:scroll-x-thin [&>*>*]:w-72! [&>*>[data-wide]]:w-96! [&>*>*]:shrink-0! [&>*>*]:snap-start"
        }
        ref={row}
      >
        {children}
      </div>
      {carousel ? (
        <div className="flex justify-end gap-2">
          <Button
            aria-label="Previous"
            // Stay small, even when the block's buttons are set to full width.
            className="w-9! flex-none!"
            onClick={() => move(-1)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronLeft />
          </Button>
          <Button
            aria-label="Next"
            className="w-9! flex-none!"
            onClick={() => move(1)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Wraps a facts look in a swiping row or carousel when chosen. */
function MaybeRow({
  arrange,
  children,
}: {
  arrange?: Arrange;
  children: ReactNode;
}) {
  if (arrange !== "scroll" && arrange !== "carousel") return <>{children}</>;
  return <ScrollRow carousel={arrange === "carousel"}>{children}</ScrollRow>;
}
/**
 * The arrangements each facts look works with: a table or list can't be cut
 * into a swiping row, and pills and one-liners only wrap or swipe. Looks not
 * named here (cards and tiles) work with all of them.
 */
const NO_ARRANGE = [
  "list",
  "table",
  "spec-sheet",
  "journey",
  "columns",
  "card-table",
];
const WRAP_OR_SWIPE = ["chips", "inline", "big-pills"];
export function arrangesFor(look: string): Arrange[] {
  if (NO_ARRANGE.includes(look)) return [];
  if (WRAP_OR_SWIPE.includes(look)) return ["fill", "scroll"];
  return ["fill", "grid", "scroll", "carousel"];
}
/** The chosen arrangement if the look works with it, or the look's first. */
export function keptArrange(look: string, arrange?: Arrange): Arrange {
  const ok = arrangesFor(look);
  return arrange && ok.includes(arrange) ? arrange : (ok[0] ?? "fill");
}

/** Items wrap onto rows and grow, so every row (the last too) fills the width. */
const STRETCH = "flex flex-wrap [&>*]:grow";
const SWIPE =
  "flex flex-nowrap snap-x overflow-x-auto pb-1 [scrollbar-width:none] [&>*]:shrink-0 [&>*]:snap-start";

export type FactsVariant =
  "grid" | "pairs" | "list" | "table" | "inline" | "chips" | "tiles";

/**
 * The facts, with a different look and arrangement on phones if chosen
 * ("same" keeps the computer one). Both are drawn and CSS shows the right
 * one, so there's no jump when the page loads.
 */
/** A setting for phones and tablets: "same" as computers, or (tablets) "phone" as phones. */
type ForDevice<T> = T | "same" | "phone";

/**
 * Draws a part with a different look on phones (under 768px), tablets
 * (768–1023px) and computers (1024px and wider). Each different look is
 * drawn once and CSS shows the right one, so nothing jumps on load.
 */
function ByDevice<L extends object>({
  computer,
  tablet,
  phone,
  draw,
}: {
  computer: L;
  tablet: { [K in keyof L]?: ForDevice<L[K]> };
  phone: { [K in keyof L]?: ForDevice<L[K]> };
  draw: (look: L) => ReactNode;
}) {
  const keys = Object.keys(computer) as (keyof L)[];
  const onPhone = { ...computer };
  const onTablet = { ...computer };
  for (const k of keys) {
    const ph = phone[k];
    if (ph !== undefined && ph !== "same" && ph !== "phone")
      onPhone[k] = ph as L[keyof L];
  }
  for (const k of keys) {
    const tb = tablet[k];
    if (tb === "phone") onTablet[k] = onPhone[k];
    else if (tb !== undefined && tb !== "same") onTablet[k] = tb as L[keyof L];
  }
  const same = (a: L, b: L) => keys.every((k) => a[k] === b[k]);
  if (same(onPhone, computer) && same(onTablet, computer))
    return <>{draw(computer)}</>;
  if (same(onTablet, computer))
    return (
      <>
        <div className="md:hidden">{draw(onPhone)}</div>
        <div className="max-md:hidden">{draw(computer)}</div>
      </>
    );
  if (same(onTablet, onPhone))
    return (
      <>
        <div className="lg:hidden">{draw(onPhone)}</div>
        <div className="max-lg:hidden">{draw(computer)}</div>
      </>
    );
  return (
    <>
      <div className="md:hidden">{draw(onPhone)}</div>
      <div className="max-md:hidden lg:hidden">{draw(onTablet)}</div>
      <div className="max-lg:hidden">{draw(computer)}</div>
    </>
  );
}

export type FactLines = "between" | "every" | "none";

/** An optional box around one part of the Details card (facts, essentials…). */
export type PartBox = "none" | "outline" | "card" | "grey";
function Boxed({
  box = "none",
  dark = false,
  children,
}: {
  box?: PartBox;
  dark?: boolean;
  children: ReactNode;
}) {
  if (box === "none") return <>{children}</>;
  return (
    // Marked so Block layout's "Shadows: Remove" leaves a box you chose alone.
    <div
      data-part-box=""
      className={cn(
        "rounded-xl p-4",
        box === "outline" && (dark ? "border border-white/15" : "border"),
        box === "card" &&
          (dark
            ? "border border-white/15 bg-white/5"
            : "border bg-card shadow-sm"),
        box === "grey" && (dark ? "bg-white/10" : "bg-muted/50"),
      )}
    >
      {children}
    </div>
  );
}

export function DeviceFacts({
  p,
  dark,
  variant = "grid",
  arrange = "fill",
  phoneVariant = "same",
  phoneArrange = "same",
  tabletVariant = "same",
  tabletArrange = "same",
  showEmpty = false,
  box = "none",
  phoneBox = "same",
  tabletBox = "same",
  lines = "between",
  heading,
}: {
  lines?: FactLines;
  /** A heading of your own above the facts (blank: none). */
  heading?: string;
  p: WalkIdeaParts;
  dark?: boolean;
  variant?: FactsVariant;
  arrange?: Arrange;
  phoneVariant?: FactsVariant | "same";
  phoneArrange?: Arrange | "same";
  tabletVariant?: ForDevice<FactsVariant>;
  tabletArrange?: ForDevice<Arrange>;
  showEmpty?: boolean;
  box?: PartBox;
  phoneBox?: PartBox | "same";
  tabletBox?: ForDevice<PartBox>;
}) {
  return (
    <ByDevice
      computer={{ variant, arrange, box }}
      draw={(look) => (
        <Boxed box={look.box} dark={dark}>
          <div className="flex flex-col gap-2">
            <PartHeading text={heading} />
            <MaybeRow arrange={keptArrange(look.variant, look.arrange)}>
              <Facts
                arrange={keptArrange(look.variant, look.arrange)}
                dark={dark}
                lines={lines}
                p={p}
                showEmpty={showEmpty}
                variant={look.variant}
              />
            </MaybeRow>
          </div>
        </Boxed>
      )}
      phone={{ variant: phoneVariant, arrange: phoneArrange, box: phoneBox }}
      tablet={{
        variant: tabletVariant,
        arrange: tabletArrange,
        box: tabletBox,
      }}
    />
  );
}

// ── Essentials ──────────────────────────────────────────────────────────
export type EssentialsLook =
  | "pills"
  | "chips"
  | "list"
  | "tiles"
  | "inline"
  | "ticks"
  | "circles"
  | "cards"
  | "rows"
  | "big-icons"
  | "words"
  | "segments";

/** The walk's ticked essentials, in one of several looks. */
function EssentialsView({
  p,
  look,
  arrange,
  heading,
  showEmpty,
  dark = false,
  box = "none",
  headingText,
}: {
  headingText?: string;
  p: WalkIdeaParts;
  look: EssentialsLook;
  arrange: Arrange;
  heading: boolean;
  showEmpty: boolean;
  dark?: boolean;
  box?: PartBox;
}) {
  const items = walkEssentialItems(p.walk.essentials, useWalkEssentials());
  const muted = dark ? "text-white/60" : "text-muted-foreground";
  // The same heading as the Description's and the other parts'.
  const title = heading ? (
    <h2 className="text-base font-semibold">
      {headingText?.trim() || "Essentials"}
    </h2>
  ) : null;
  if (items.length === 0)
    // Organisers can ask to see that none are ticked; otherwise nothing.
    return showEmpty && p.tools ? (
      <p className={cn("text-xs", muted)}>
        <span className="font-medium tracking-wide uppercase">Essentials</span>{" "}
        · None ticked
      </p>
    ) : null;
  // A carousel is a swiping row with ‹ › buttons under it.
  const swipe = arrange === "scroll" || arrange === "carousel";
  const icon = (name: string, className = "size-3.5") => {
    const Icon = essentialIcon(name);
    return <Icon aria-hidden="true" className={cn(className, muted)} />;
  };
  let body: ReactNode;
  if (look === "inline")
    body = (
      <p
        className={cn(
          "flex flex-wrap gap-x-3 gap-y-1 text-sm",
          swipe && cn(SWIPE, "whitespace-nowrap"),
        )}
      >
        {items.map((item) => (
          <span className="flex items-center gap-1.5" key={item.key}>
            {icon(item.icon)}
            {item.label}
          </span>
        ))}
      </p>
    );
  else if (look === "list" || look === "ticks")
    body = (
      <ul
        className={cn(
          "grid gap-1.5 text-sm sm:grid-cols-2",
          swipe && cn(SWIPE, "gap-4 whitespace-nowrap"),
        )}
      >
        {items.map((item) => (
          <li className="flex items-center gap-2" key={item.key}>
            {look === "ticks" ? (
              <Check aria-hidden className="size-4 text-foreground" />
            ) : (
              icon(item.icon, "size-4")
            )}
            {item.label}
          </li>
        ))}
      </ul>
    );
  else if (look === "circles" || look === "big-icons")
    body = (
      <ul
        className={cn(
          "grid grid-cols-3 gap-4 sm:grid-cols-6",
          arrange === "fill" && cn(STRETCH, "[&>*]:basis-24"),
          swipe && cn(SWIPE, "gap-4 [&>*]:w-24"),
        )}
      >
        {items.map((item) => (
          <li
            className="flex flex-col items-center gap-2 text-center text-xs"
            key={item.key}
          >
            {look === "circles" ? (
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full",
                  dark ? "bg-white/10" : "bg-muted",
                )}
              >
                {icon(item.icon, "size-5")}
              </span>
            ) : (
              icon(item.icon, "size-6")
            )}
            {item.label}
          </li>
        ))}
      </ul>
    );
  else if (look === "cards")
    body = (
      <ul
        className={cn(
          "grid gap-2 sm:grid-cols-3",
          arrange === "fill" && cn(STRETCH, "[&>*]:basis-44"),
          swipe && cn(SWIPE, "[&>*]:w-48"),
        )}
      >
        {items.map((item) => (
          <li
            className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm"
            key={item.key}
          >
            {icon(item.icon, "size-4")}
            {item.label}
          </li>
        ))}
      </ul>
    );
  else if (look === "rows")
    body = (
      <ul
        className={cn(
          "flex flex-col divide-y text-sm",
          swipe && cn(SWIPE, "flex-row gap-6 divide-y-0 whitespace-nowrap"),
        )}
      >
        {items.map((item) => (
          <li
            className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
            key={item.key}
          >
            <span className="flex items-center gap-2">
              {icon(item.icon, "size-4")}
              {item.label}
            </span>
            <Check aria-hidden className={cn("size-4", muted)} />
          </li>
        ))}
      </ul>
    );
  else if (look === "words")
    body = (
      <p
        className={cn(
          "text-sm",
          swipe && "overflow-x-auto whitespace-nowrap [scrollbar-width:none]",
        )}
      >
        {items.map((item, i) => (
          <span key={item.key}>
            {i > 0 ? (
              <span aria-hidden className={cn("mx-2", muted)}>
                ·
              </span>
            ) : null}
            {item.label}
          </span>
        ))}
      </p>
    );
  else if (look === "segments")
    body = (
      <ul
        className={cn(
          "grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] overflow-hidden rounded-lg border",
          swipe && cn(SWIPE, "[&>*]:w-36"),
        )}
      >
        {items.map((item) => (
          <li
            className="-ml-px flex flex-col items-start gap-2 border-l px-4 py-3 text-sm"
            key={item.key}
          >
            {icon(item.icon, "size-4")}
            {item.label}
          </li>
        ))}
      </ul>
    );
  else if (look === "tiles")
    body = (
      <ul
        className={cn(
          "grid grid-cols-2 gap-2 sm:grid-cols-4",
          arrange === "fill" && cn(STRETCH, "[&>*]:basis-32"),
          swipe && cn(SWIPE, "[&>*]:w-32"),
        )}
      >
        {items.map((item) => (
          <li
            className={cn(
              "flex flex-col items-start gap-2 rounded-xl p-3 text-sm",
              dark ? "bg-white/10" : "bg-muted/60",
            )}
            key={item.key}
          >
            {icon(item.icon, "size-5")}
            {item.label}
          </li>
        ))}
      </ul>
    );
  else
    body = (
      <ul
        className={cn(
          "flex flex-wrap gap-1.5",
          swipe && cn(SWIPE, "whitespace-nowrap"),
        )}
      >
        {items.map((item) => (
          <li
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs whitespace-nowrap",
              look === "chips" ? (dark ? "bg-white/10" : "bg-muted") : "border",
            )}
            key={item.key}
          >
            {icon(item.icon)}
            {item.label}
          </li>
        ))}
      </ul>
    );
  return (
    <Boxed box={box} dark={dark}>
      <div className="flex flex-col gap-2">
        {title}
        {arrange === "carousel" ? (
          <ScrollRow carousel natural>
            {body}
          </ScrollRow>
        ) : (
          body
        )}
      </div>
    </Boxed>
  );
}

export type EssentialsOptions = {
  look?: EssentialsLook;
  arrange?: Arrange;
  phoneLook?: EssentialsLook | "same";
  phoneArrange?: Arrange | "same";
  tabletLook?: ForDevice<EssentialsLook>;
  tabletArrange?: ForDevice<Arrange>;
  heading?: boolean;
  showEmpty?: boolean;
  box?: PartBox;
  phoneBox?: PartBox | "same";
  tabletBox?: ForDevice<PartBox>;
  /** The heading's words (blank: Essentials). */
  headingText?: string;
};

function DeviceEssentials({
  p,
  dark,
  o,
}: {
  p: WalkIdeaParts;
  dark?: boolean;
  o: EssentialsOptions;
}) {
  return (
    <ByDevice
      computer={{
        look: o.look ?? "pills",
        arrange: o.arrange ?? "scroll",
        box: o.box ?? "none",
      }}
      draw={(look) => (
        <EssentialsView
          headingText={o.headingText}
          box={look.box}
          arrange={look.arrange}
          dark={dark}
          heading={o.heading ?? true}
          look={look.look}
          p={p}
          showEmpty={o.showEmpty ?? false}
        />
      )}
      phone={{
        look: o.phoneLook ?? "same",
        arrange: o.phoneArrange ?? "same",
        box: o.phoneBox ?? "same",
      }}
      tablet={{
        look: o.tabletLook ?? "same",
        arrange: o.tabletArrange ?? "same",
        box: o.tabletBox ?? "same",
      }}
    />
  );
}

/** Restyles the walk's messages (and any other message boxes) inside a block. */
export type MessageLook =
  | "as-is"
  | "boxes"
  | "band-outline"
  | "band-bar"
  | "band-line"
  | "soft"
  | "bold"
  | "compact"
  | "stripe"
  | "hidden";
/**
 * A message as one straight line, like the Status band's "Upcoming ·
 * Clock-in opens at…": its title, a dot, then the rest (reason and all),
 * at the same weight, instead of the title sitting on top. No icon (it
 * would sit on a line of its own). Forced (!): line-clamp-none, used before,
 * also made the title a block, so the rest still fell to a second line.
 */
const ONE_LINE_MESSAGE =
  "[&_[data-slot=alert]]:block [&_[data-slot=alert]>svg]:hidden [&_[data-slot=alert]_*]:[font-weight:inherit] [&_[data-slot=alert-title]]:inline! [&_[data-slot=alert-title]]:[-webkit-line-clamp:unset] [&_[data-slot=alert-title]]:after:content-['_·_'] [&_[data-slot=alert-description]]:inline! [&_[data-slot=alert-description]_*]:inline! [&_[data-slot=alert-description]_p+p]:before:content-['_']";

export const MESSAGE_LOOK: Record<MessageLook, string> = {
  // The default: a plain grey band, like the Status band (no blue or red boxes).
  "as-is":
    "[&_[data-slot=alert]]:rounded-lg [&_[data-slot=alert]]:border-0 [&_[data-slot=alert]]:bg-muted [&_[data-slot=alert]]:text-foreground [&_[data-slot=alert]]:font-normal [&_[data-slot=alert]_*]:text-inherit" +
    " " +
    ONE_LINE_MESSAGE,
  boxes: "",
  "band-outline":
    "[&_[data-slot=alert]]:rounded-lg [&_[data-slot=alert]]:border [&_[data-slot=alert]]:bg-transparent [&_[data-slot=alert]]:text-foreground [&_[data-slot=alert]]:font-normal [&_[data-slot=alert]_*]:text-inherit" +
    " " +
    ONE_LINE_MESSAGE,
  "band-bar":
    "[&_[data-slot=alert]]:rounded-none [&_[data-slot=alert]]:border-0 [&_[data-slot=alert]]:border-l-4 [&_[data-slot=alert]]:border-l-foreground [&_[data-slot=alert]]:bg-muted [&_[data-slot=alert]]:text-foreground [&_[data-slot=alert]]:font-normal [&_[data-slot=alert]_*]:text-inherit" +
    " " +
    ONE_LINE_MESSAGE,
  "band-line":
    "[&_[data-slot=alert]]:rounded-none [&_[data-slot=alert]]:border-0 [&_[data-slot=alert]]:border-b [&_[data-slot=alert]]:bg-transparent [&_[data-slot=alert]]:px-0 [&_[data-slot=alert]]:text-foreground [&_[data-slot=alert]]:font-normal [&_[data-slot=alert]_*]:text-inherit" +
    " " +
    ONE_LINE_MESSAGE,
  soft: "[&_[data-slot=alert]]:border-0 [&_[data-slot=alert]]:bg-muted/60",
  bold: "[&_[data-slot=alert]]:border-0 [&_[data-slot=alert]]:bg-foreground [&_[data-slot=alert]]:text-background [&_[data-slot=alert]_*]:!text-background",
  compact:
    "[&_[data-slot=alert]]:gap-y-0 [&_[data-slot=alert]]:py-2 [&_[data-slot=alert]]:text-xs [&_[data-slot=alert-description]]:text-xs",
  stripe:
    "[&_[data-slot=alert]]:rounded-none [&_[data-slot=alert]]:border-0 [&_[data-slot=alert]]:border-l-4 [&_[data-slot=alert]]:border-l-muted-foreground [&_[data-slot=alert]]:bg-transparent",
  hidden: "[&_[data-slot=alert]]:hidden",
};

/** Restyles boxes (cards: the clock-in panel, weather, Before you set off…) inside a block. */
export type BoxLook = "as-is" | "flat" | "tint" | "outline";
export const BOX_LOOK: Record<BoxLook, string> = {
  "as-is": "",
  flat: "[&_[data-slot=card]]:border-0 [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:shadow-none",
  tint: "[&_[data-slot=card]]:border-0 [&_[data-slot=card]]:bg-muted/50 [&_[data-slot=card]]:shadow-none",
  outline:
    "[&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:shadow-none",
};

function Facts({
  p,
  variant,
  dark = false,
  arrange = "fill",
  showEmpty = false,
  lines = "between",
}: {
  p: WalkIdeaParts;
  variant: FactsVariant;
  dark?: boolean;
  arrange?: Arrange;
  showEmpty?: boolean;
  /** List and table looks: lines between rows, under every row, or none. */
  lines?: FactLines;
}) {
  const swipe = arrange === "scroll";
  const { facts } = useWalkInfo(p, showEmpty);
  const muted = dark ? "text-white/60" : "text-muted-foreground";
  if (variant === "inline")
    return (
      <p
        className={cn(
          "flex flex-wrap gap-x-4 gap-y-1.5 text-sm",
          dark && "text-white/90",
          swipe && cn(SWIPE, "whitespace-nowrap"),
        )}
        suppressHydrationWarning
      >
        {facts.map((fact) => (
          <span className="flex items-center gap-1.5" key={fact.label}>
            <fact.icon aria-hidden className={cn("size-4", muted)} />
            {fact.value}
          </span>
        ))}
      </p>
    );
  if (variant === "chips")
    return (
      <ul
        className={cn(
          "flex flex-wrap gap-1.5",
          swipe && cn(SWIPE, "whitespace-nowrap"),
        )}
      >
        {facts.map((fact) => (
          <li
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs sm:text-sm",
              dark ? "bg-white/10" : "bg-muted",
            )}
            data-wide={fact.wide ? "" : undefined}
            key={fact.label}
          >
            <fact.icon aria-hidden className="size-3.5 opacity-70" />
            <span suppressHydrationWarning>{fact.value}</span>
          </li>
        ))}
      </ul>
    );
  if (variant === "tiles")
    return (
      <dl
        className={cn(
          "grid grid-cols-2 gap-2 sm:grid-cols-4",
          arrange === "fill" && cn(STRETCH, "[&>*]:basis-40"),
          swipe && cn(SWIPE, "[&>*]:w-40"),
        )}
      >
        {facts.map((fact) => (
          <div
            className={cn(
              "flex min-w-0 flex-col gap-1 rounded-xl p-3",
              dark ? "bg-white/10" : "bg-muted/60",
            )}
            data-wide={fact.wide ? "" : undefined}
            key={fact.label}
          >
            <dt className={cn("flex items-center gap-1.5 text-xs", muted)}>
              <fact.icon aria-hidden className="size-3.5" />
              {fact.label}
            </dt>
            <dd
              className="truncate text-sm font-semibold"
              suppressHydrationWarning
            >
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  if (variant === "list" || variant === "table")
    return (
      <dl
        className={cn(
          "grid text-sm sm:grid-cols-2 sm:gap-x-8",
          variant === "table" && "sm:grid-cols-1",
          // Between rows only: each row's line sits 1px into the next row,
          // so the last row's line falls outside the list and is cut off.
          lines === "between" && "overflow-hidden [&>*]:-mb-px",
        )}
      >
        {facts.map((fact) => (
          <div
            className={cn(
              "flex items-baseline justify-between gap-4 py-2",
              lines !== "none" && "border-b",
              dark && "border-white/15",
            )}
            data-wide={fact.wide ? "" : undefined}
            key={fact.label}
          >
            <dt className={cn("flex shrink-0 items-center gap-2", muted)}>
              <fact.icon aria-hidden className="size-4" />
              {fact.label}
            </dt>
            <dd
              className="min-w-0 text-right font-medium [overflow-wrap:anywhere]"
              suppressHydrationWarning
            >
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-4",
        variant !== "pairs" && "sm:grid-cols-3 lg:grid-cols-4",
        arrange === "fill" &&
          cn(
            STRETCH,
            variant === "pairs"
              ? "[&>*]:basis-[calc(50%-0.75rem)]"
              : "[&>*]:basis-36",
          ),
        swipe && cn(SWIPE, "[&>*]:w-36"),
      )}
    >
      {facts.map((fact) => (
        <div
          className={cn(
            "flex min-w-0 flex-col gap-0.5",
            fact.wide && "col-span-2",
          )}
          data-wide={fact.wide ? "" : undefined}
          key={fact.label}
        >
          <dt className={cn("flex items-center gap-1.5 text-xs", muted)}>
            <fact.icon aria-hidden className="size-3.5" />
            {fact.label}
          </dt>
          <dd
            className="text-sm font-semibold [overflow-wrap:anywhere]"
            suppressHydrationWarning
          >
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export type TimelineLook = "bar" | "cells" | "dots" | "line" | "list";

export type TimelineOptions = {
  look?: TimelineLook;
  /** Which of the walk's own times to show (all by default). */
  opens?: boolean;
  start?: boolean;
  end?: boolean;
};

type TimelineItem = { time: string; label: string };

/**
 * The day's times: clock-in opens, set off and finish, in one of several
 * plain looks.
 */
function Timeline({ p, o = {} }: { p: WalkIdeaParts; o?: TimelineOptions }) {
  const { opens, start, end, progress } = useWalkInfo(p);
  const look = o.look ?? "bar";
  const items: TimelineItem[] = [
    ...(o.opens === false
      ? []
      : [{ time: formatTime(opens), label: "Clock-in opens" }]),
    ...(o.start === false
      ? []
      : [{ time: formatTime(start), label: "Set off" }]),
    ...(o.end === false ? [] : [{ time: formatTime(end), label: "Finish" }]),
  ];
  if (items.length === 0) return null;
  if (look === "cells")
    return (
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] overflow-hidden rounded-lg border">
        {items.map((item) => (
          <li
            className="-ml-px flex flex-col gap-0.5 border-l px-4 py-3"
            key={item.time + item.label}
            suppressHydrationWarning
          >
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-base font-semibold tabular-nums">
              {item.time}
            </span>
          </li>
        ))}
      </ul>
    );
  if (look === "dots")
    return (
      <ol className="relative flex justify-between gap-4">
        {/* The line the dots sit on. */}
        <span
          aria-hidden
          className="absolute inset-x-1.5 top-[5px] h-px bg-border"
        />
        {items.map((item) => (
          <li
            className="relative flex min-w-0 flex-col gap-1.5 first:items-start last:items-end [&:not(:first-child):not(:last-child)]:items-center"
            key={item.time + item.label}
            suppressHydrationWarning
          >
            <span className="size-3 rounded-full border-2 border-muted-foreground/60 bg-background" />
            <span className="text-sm font-semibold tabular-nums">
              {item.time}
            </span>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </li>
        ))}
      </ol>
    );
  if (look === "line")
    return (
      <p
        className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground"
        suppressHydrationWarning
      >
        {items.map((item, i) => (
          <span key={item.time + item.label}>
            {i > 0 ? (
              <span aria-hidden className="mr-2">
                ·
              </span>
            ) : null}
            <span className="font-medium text-foreground tabular-nums">
              {item.time}
            </span>{" "}
            {item.label.toLowerCase()}
          </span>
        ))}
      </p>
    );
  if (look === "list")
    return (
      <ul className="flex flex-col divide-y text-sm">
        {items.map((item) => (
          <li
            className="flex gap-4 py-2 first:pt-0 last:pb-0"
            key={item.time + item.label}
            suppressHydrationWarning
          >
            <span className="w-12 font-semibold tabular-nums">{item.time}</span>
            <span className="text-muted-foreground">{item.label}</span>
          </li>
        ))}
      </ul>
    );
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-foreground/60"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div
        className="flex justify-between gap-3 text-xs text-muted-foreground"
        suppressHydrationWarning
      >
        {items.map((item) => (
          <span key={item.time + item.label}>
            {item.time} {item.label.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Walk blocks ─────────────────────────────────────────────────────────
/** The walk's messages (clock-in times, cancelled, finished…), in the chosen look. */
export function MessagesBlock({
  look = "as-is",
  editing = false,
}: {
  look?: MessageLook;
  editing?: boolean;
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Messages (only when there are any)" />;
  // The messages show as the strip under the header instead.
  if (p.noticesInStrip)
    return editing ? (
      <Placeholder label="Messages show at the top of the page — to show them here instead, set Where the walk's messages go to Where I put the Messages block in the Page settings (click an empty part of the page)" />
    ) : null;
  return (
    <MessagesOrSample className={MESSAGE_LOOK[look]} editing={editing} p={p} />
  );
}

export const ClockInBlock = withParts(
  "Clock-in (members: clock in and who's on the walk)",
  (p) => <>{p.live}</>,
);

export type BandStyle = "grey" | "outline" | "bar" | "line";

export type TitleVariant = "plain" | "chips" | "stats" | "band";

const TITLE_VARIANTS: readonly string[] = ["plain", "chips", "stats", "band"];

/**
 * Title looks that were taken out (the other Status bands and the rest) fall
 * back to one that's kept, so pages saved with them still show a title.
 */
export function keptTitleVariant(variant: string): TitleVariant {
  if (TITLE_VARIANTS.includes(variant)) return variant as TitleVariant;
  return variant.startsWith("band") ? "band" : "plain";
}

export function TitleBlock({
  variant = "plain",
  actions = true,
}: {
  variant?: TitleVariant;
  actions?: boolean;
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label={`Title · ${variant}`} />;
  return <Title actions={actions} p={p} variant={variant} />;
}

export type TitleGap = "closer" | "normal" | "more";

/**
 * The gaps between the things in the title box — the band to the name, the
 * name to Created by, and between the facts, timeline and description —
 * never the space at the box's sides.
 */
export const TITLE_GAP: Record<
  TitleGap,
  { top: string; lines: string; head: string; stack: string }
> = {
  closer: {
    top: "pt-3 sm:pt-3",
    lines: "gap-1",
    head: "gap-2",
    stack: "gap-3",
  },
  normal: { top: "", lines: "gap-1.5", head: "gap-6", stack: "gap-6" },
  more: { top: "pt-6 sm:pt-8", lines: "gap-2", head: "gap-8", stack: "gap-8" },
};

function Title({
  p,
  variant,
  actions,
  bandMessages = null,
  afterNote = null,
  underNote = null,
  bandCountdown = false,
  bandStyle = "grey",
  gap = "normal",
}: {
  /** Right under "Created by", tucked in with the name (Your clock-in,
   * Countdown when placed there). */
  underNote?: ReactNode;
  /** Add the countdown to the band's line ("… · 7 days to go"). */
  bandCountdown?: boolean;
  /** How much space inside the Status band look's box. */
  gap?: TitleGap;
  /** The Status band look's band: grey, outlined, grey with a dark bar, or a line under it. */
  bandStyle?: BandStyle;
  p: WalkIdeaParts;
  variant: TitleVariant;
  actions: boolean;
  /** The walk's messages, as plain text inside the Status band look. */
  bandMessages?: ReactNode;
  /** Something under "Created by" inside the Status band look's box (the description). */
  afterNote?: ReactNode;
}) {
  const info = useWalkInfo(p);
  const h = p.headline;
  const note =
    h.note || underNote ? (
      <>
        {h.note ? (
          <p className="text-xs text-muted-foreground">{h.note}</p>
        ) : null}
        {underNote}
      </>
    ) : null;
  const act = actions ? <Actions className="sm:shrink-0" p={p} /> : null;
  const heading = (className?: string) => (
    <h1
      className={cn(
        "text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl",
        className,
      )}
    >
      {h.title}
    </h1>
  );
  const day = formatWalkDay(info.start);
  const time = formatTime(info.start);
  switch (keptTitleVariant(variant)) {
    case "chips":
      return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {heading()}
              <Badge p={p} />
            </div>
            <Facts p={p} variant="chips" />
            {note}
          </div>
          {act}
        </div>
      );
    case "stats":
      return (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              <StatusLine p={p} />
              {heading("sm:text-4xl")}
              {note}
            </div>
            {act}
          </div>
          <dl className="grid grid-cols-2 border-y sm:grid-cols-4">
            {[
              { label: "Starts", value: time, sub: day },
              {
                label: "Length",
                value: formatWalkLength(h.durationMins),
                sub: h.distance,
              },
              { label: "Grade", value: h.grade ?? "—", sub: h.elevationGain },
              {
                label: "Meet at",
                value: p.meeting ?? "—",
                sub: p.what3words ? `///${p.what3words}` : null,
              },
            ].map((stat, i) => (
              <div
                className={cn(
                  "flex min-w-0 flex-col gap-0.5 py-3 sm:px-4 sm:first:pl-0",
                  i > 0 && "sm:border-l",
                  i % 2 === 1 && "max-sm:border-l max-sm:pl-4",
                  i > 1 && "max-sm:border-t",
                )}
                key={stat.label}
              >
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                <dd
                  className="truncate text-lg font-semibold"
                  suppressHydrationWarning
                >
                  {stat.value}
                </dd>
                {stat.sub ? (
                  <dd className="truncate text-xs text-muted-foreground">
                    {stat.sub}
                  </dd>
                ) : null}
              </div>
            ))}
          </dl>
        </div>
      );
    case "band": {
      // The Status band: an outlined box with a grey band (status and date,
      // or the walk's messages in their place) and the walk's name.
      const bandClass = cn(
        // On a phone the status often wraps onto two lines with the date
        // under it, so it gets more room around it and between the lines.
        "flex flex-col gap-2 text-sm leading-relaxed font-medium text-foreground sm:leading-normal",
        "px-4 py-3.5 sm:px-5 sm:py-2.5",
        bandStyle === "grey" && "bg-muted",
        bandStyle === "outline" && "border-b",
        bandStyle === "bar" && "border-l-4 border-l-foreground bg-muted",
        bandStyle === "line" && "mx-4 border-b px-0 sm:mx-5 sm:px-0",
        // A message in the band takes the place of the status and date.
        "[&:has([data-messages]:not(:empty))>[data-band-status]]:hidden [&:has([data-sample])>[data-band-status]]:hidden",
      );
      const counting =
        bandCountdown &&
        info.status !== "completed" &&
        info.status !== "cancelled";
      const countdownText = counting
        ? ` · ${`${info.countdown.value} ${info.countdown.unit}`.trim()}`
        : "";
      // The wording is from Settings → Site wording → Walk page cards.
      const statusText = `${info.now.eyebrow} · ${info.now.line}${countdownText}`;
      const bandStatus = (
        <div
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 sm:gap-y-1"
          data-band-status=""
        >
          {/* Always one row: a touch smaller on the narrowest phones, and
              cut off with "…" only if it still can't fit. */}
          <span className="min-w-0 truncate max-[389px]:text-[13px] max-[359px]:text-xs">
            {statusText}
          </span>
        </div>
      );
      const band = (
        <div className={bandClass} suppressHydrationWarning>
          {bandStatus}
          {bandMessages}
        </div>
      );
      // The name and Manage on one row; anything else (facts, timeline,
      // description) under them, the full width of the box.
      const body = (
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col p-4 sm:p-5",
            TITLE_GAP[gap].top,
            TITLE_GAP[gap].stack,
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className={cn("flex min-w-0 flex-col", TITLE_GAP[gap].lines)}>
              {heading()}
              {note}
            </div>
            {act}
          </div>
          {afterNote}
        </div>
      );
      return (
        <section className="flex flex-col overflow-hidden rounded-xl border">
          {band}
          {body}
        </section>
      );
    }
    default:
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge p={p} />
              <StatusLine p={p} withEyebrow={false} />
            </div>
            {heading()}
            {note}
          </div>
          {act}
        </div>
      );
  }
}

/** What the Details card's ribbon shows, and how it looks. */
export type RibbonContent =
  "none" | "status" | "messages" | "countdown" | "when-where" | "text";
export type RibbonStyle = "soft" | "bold" | "plain" | "bar";
/** Designs saved before the ribbon had separate content and style. */
type OldRibbon = boolean | "soft" | "bold" | "bar";

export type DetailsOptions = {
  facts?: FactsVariant;
  factsArrange?: Arrange;
  map?: "none" | "top" | "side" | "bottom";
  mapButtons?: "below" | "above" | "none";
  mapHeight?: "short" | "medium" | "tall";
  mapTitle?: boolean;
  mapNote?: boolean;
  preciseAt?: PreciseAt;
  preciseLook?: PreciseLook;
  statusLook?: "badge-line" | "badge" | "line" | "pill" | "none";
  statusAt?: "above" | "below";
  /** Optional boxes around the parts inside the card. */
  factsBox?: PartBox;
  /** The space between facts (story cards, tiles…). */
  factsGap?: FactsGap;
  /** A box around the title area (name, status, Created by, Manage). */
  titleBox?: PartBox;
  /** "standard", or one of the title looks (centred, hero, date strip…). */
  titleLook?: "standard" | TitleVariant;
  /** The facts: on their own under the title box, or inside it. */
  factsAt?: "own" | "title";
  /** The Status band title look's band style. */
  bandStyle?: BandStyle;
  /** How the facts show: the facts' own looks, or another design's (ticket, bento…). */
  factsAs?: "facts" | "bento" | "none" | FactsLook | (string & {});
  /** Looks with a frame round them all (Spec sheet): show the frame. */
  factsBorder?: boolean;
  /** Facts shown as on tablets and phones ("same": as on computers). */
  tabletFactsAs?: string;
  phoneFactsAs?: string;
  /** The walk's messages inside the title box: a row (table look) or boxes, top or bottom. */
  titleMessages?:
    | "none"
    | "top-row"
    | "bottom-row"
    | "top-boxes"
    | "bottom-boxes"
    | "in-band";
  /** Headings of your own above the facts and the day's timeline (blank: none). */
  factsTitle?: string;
  timelineTitle?: string;
  /** The day's timeline: on its own under the title box, or inside it. */
  timelineAt?: "own" | "title";
  timelineLook?: TimelineLook;
  timelineOpens?: boolean;
  timelineStart?: boolean;
  timelineEnd?: boolean;
  /** The gaps between the things in the title box. */
  titleGap?: TitleGap;
  /** (Old pages) the order of the facts, timeline and description in the title box. */
  titleOrder?: string;
  /** What goes inside the title box, under the name, in this order. */
  titleParts?: { part?: string }[];
  /** Your clock-in and Countdown: tucked under "Created by", or in the list. */
  titleExtrasAt?: "under-name" | "list";
  clockinLook?: LineLook;
  countdownLook?: LineLook;
  factLines?: FactLines;
  phoneFactsBox?: PartBox | "same";
  tabletFactsBox?: ForDevice<PartBox>;
  timelineBox?: PartBox;
  descriptionBox?: PartBox;
  /** A heading above the description (blank: none). */
  descriptionTitle?: string;
  /** "title": inside the title area (and its box); "after-title": just below the title box; "own": with the other parts. */
  descriptionAt?: "own" | "title" | "after-title";
  mapButtonsLook?: DirectionsLook;
  /** For a page-width map in the card (an edge-to-edge one is always square). */
  mapCorners?: "rounded" | "square" | "very-rounded";
  /** In the designer: shows a sample message where the walk has none. */
  editing?: boolean;
  /** Space inside the card ("auto": none without a frame, normal with one). */
  inset?: "auto" | "none" | "normal" | "roomy";
  tone?: "card" | "tint" | "dark" | "plain";
  ribbon?: RibbonContent | OldRibbon;
  ribbonStyle?: RibbonStyle;
  ribbonText?: string;
  ribbonAt?: "top" | "bottom";
  phoneFacts?: FactsVariant | "same";
  phoneFactsArrange?: Arrange | "same";
  tabletFacts?: FactsVariant | "same" | "phone";
  showEmptyFacts?: boolean;
  essentials?: EssentialsOptions;
  tabletFactsArrange?: Arrange | "same" | "phone";
  timeline?: boolean;
  bigTitle?: boolean;
  showTitle?: boolean;
  showActions?: boolean;
  showEssentials?: boolean;
  showDescription?: boolean;
};

/** The one Details card: everything from Edit walk, with no boxes inside it. */
export function DetailsBlock(options: DetailsOptions) {
  const p = useWalkParts();
  if (!p)
    return <Placeholder label="Details card (everything about the walk)" />;
  return <Details o={options} p={p} />;
}

function Details({ p, o }: { p: WalkIdeaParts; o: DetailsOptions }) {
  const info = useWalkInfo(p);
  const dark = o.tone === "dark";
  // Facts shown as a bento grid bring their own name and buttons, so the
  // card's title row steps aside (nothing shows twice). Looks that were
  // taken out show as the plain facts.
  const factsAs = keptFactsAs(o.factsAs);
  const ownTitle = factsAs === "bento";
  const showTitle = (o.showTitle ?? true) && !ownTitle;
  // The title looks with facts of their own ("With fact chips", "Big name and
  // four key facts") now mean: the facts go inside the title box, in the
  // Facts shown as look — so the facts never show twice.
  const savedLook = o.titleLook ?? "standard";
  const factsLook = savedLook === "chips" || savedLook === "stats";
  const titleLook = factsLook ? "plain" : savedLook;
  // What's inside the title box (none without a title to hold it).
  const titleParts = showTitle ? titlePartsOf(o) : [];
  const inTitle = (part: TitlePart) => titleParts.includes(part);
  // (Shown even if computers have none: tablets or phones may have some.)
  const factsInTitle = inTitle("facts");
  const showActions = (o.showActions ?? true) && !ownTitle;
  // A map in the title box isn't placed anywhere else in the card.
  const map = inTitle("map") ? "none" : (o.map ?? "none");
  const padding =
    !o.inset || o.inset === "auto"
      ? o.tone === "plain"
        ? "none"
        : "normal"
      : o.inset;
  // Inset: the map's own rounded card, with the card's space around it.
  // (Empty when the walk has no map pin: then it takes no room.)
  const insetMap = (className?: string) => (
    <div
      className={cn(padding !== "none" && "px-6", "empty:hidden", className)}
      data-card-map=""
    >
      {p.map}
    </div>
  );
  // The precise location, where chosen. With no map in the card, the map
  // spots fall back to under the facts.
  const hasMap = (map !== "none" || inTitle("map")) && Boolean(p.map);
  const wanted = inTitle("precise") ? "none" : (o.preciseAt ?? "none");
  const preciseAt: PreciseAt =
    !hasMap &&
    (wanted === "above-map" || wanted === "on-map" || wanted === "below-map")
      ? "below-facts"
      : wanted;
  const precise =
    p.what3words && preciseAt !== "none" ? (
      <PreciseLocation
        address={p.what3words}
        look={o.preciseLook ?? (preciseAt === "on-map" ? "compact" : "card")}
      />
    ) : null;
  const preciseHere = (where: PreciseAt) =>
    preciseAt === where ? precise : null;
  const preciseInTitle = p.what3words ? (
    <PreciseLocation address={p.what3words} look={o.preciseLook ?? "card"} />
  ) : null;
  // The walk's messages inside the title box, if chosen: as a row of the
  // box divided off by a line (a table look), or as their own boxes.
  const titleMessagesAt = o.titleMessages ?? "none";
  // The Status band has its own outline: no box around it as well.
  const titleBox = titleLook.startsWith("band") ? "none" : o.titleBox;
  const titleBoxed = (titleBox ?? "none") !== "none";
  const titleMessages = (where: "top" | "bottom") => {
    if (
      titleMessagesAt === "none" ||
      titleMessagesAt === "in-band" ||
      !titleMessagesAt.startsWith(where)
    )
      return null;
    // The messages are at the top of the page (Page setting), not here.
    if (p.noticesInStrip) return null;
    const row = titleMessagesAt.endsWith("row");
    return (
      <MessagesOrSample
        className={cn(
          row &&
            "gap-0 [&_[data-slot=alert]]:rounded-none [&_[data-slot=alert]]:border-0 [&>div]:gap-0",
          row && ONE_LINE_MESSAGE,
          // Out to the box's edges (it has 16px inside), with a line between.
          row &&
            titleBoxed &&
            (where === "top"
              ? "-mx-4 -mt-4 mb-4 overflow-hidden rounded-t-xl border-b"
              : "-mx-4 mt-4 -mb-4 overflow-hidden rounded-b-xl border-t"),
          row &&
            !titleBoxed &&
            (where === "top" ? "mb-6 border-b" : "mt-6 border-t"),
          !row && (where === "top" ? "mb-6" : "mt-6"),
        )}
        editing={o.editing ?? false}
        p={p}
      />
    );
  };
  // The description: on its own (its own box), or inside the title area.
  // The day's timeline, inside the title box (under Created by) if chosen.
  const timelineInTitle = inTitle("timeline");
  const timelineView = (
    <div className="flex flex-col gap-2">
      <PartHeading text={o.timelineTitle} />
      <Timeline
        o={{
          end: o.timelineEnd,
          look: o.timelineLook,
          opens: o.timelineOpens,
          start: o.timelineStart,
        }}
        p={p}
      />
    </div>
  );
  const descriptionInTitle = inTitle("description");
  // Just below the title box (outside its outline), with its own box.
  const descriptionAfterTitle =
    !descriptionInTitle && o.descriptionAt === "after-title";
  const descriptionPart =
    ((o.showDescription ?? true) || descriptionInTitle) &&
    p.walk.description ? (
      descriptionInTitle ? (
        <DescriptionWithHeading
          description={p.walk.description}
          heading={o.descriptionTitle}
        />
      ) : (
        <Boxed box={o.descriptionBox} dark={dark}>
          <DescriptionWithHeading
            description={p.walk.description}
            heading={o.descriptionTitle}
          />
        </Boxed>
      )
    ) : null;
  const cardExtras = (
    <>
      {preciseHere("below-facts")}
      {(o.showEssentials ?? true) && !inTitle("essentials") ? (
        <DeviceEssentials dark={dark} o={o.essentials ?? {}} p={p} />
      ) : null}
      {descriptionInTitle || descriptionAfterTitle ? null : descriptionPart}
      {preciseHere("bottom")}
    </>
  );
  // The status: "Upcoming" badge and/or its words, as chosen.
  const statusLook = o.statusLook ?? "badge-line";
  const statusRow =
    statusLook === "none" ? null : statusLook === "pill" ? (
      <span
        className={cn(
          "flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm",
          info.now.tone,
        )}
        suppressHydrationWarning
      >
        <span
          aria-hidden
          className={cn(
            "size-2 rounded-full",
            info.now.live ? "bg-emerald-500" : "bg-current opacity-50",
          )}
        />
        <span className="font-semibold">{info.now.eyebrow}</span>
        <span className="opacity-80">{info.now.line}</span>
      </span>
    ) : (
      <div className="flex flex-wrap items-center gap-2">
        {statusLook !== "line" ? <Badge p={p} /> : null}
        {statusLook !== "badge" ? (
          <StatusLine
            className={dark ? "text-white/80" : undefined}
            p={p}
            withEyebrow={statusLook === "line"}
          />
        ) : null}
      </div>
    );
  // The facts in one design (or none), with its arrangement and box.
  const factsIn = (as: string, arrange?: Arrange, box?: PartBox) =>
    as === "facts" ? (
      <DeviceFacts
        arrange={o.factsArrange}
        dark={dark}
        p={p}
        phoneArrange={o.phoneFactsArrange}
        phoneVariant={o.phoneFacts}
        showEmpty={o.showEmptyFacts}
        tabletArrange={o.tabletFactsArrange}
        tabletVariant={o.tabletFacts}
        variant={o.facts ?? "grid"}
        box={o.factsBox}
        heading={o.factsTitle}
        lines={o.factLines}
        phoneBox={o.phoneFactsBox}
        tabletBox={o.tabletFactsBox}
      />
    ) : as === "none" ? null : (
      // The same facts in one of the other designs' looks, inside this card.
      <Boxed box={box} dark={dark}>
        <div className="flex flex-col gap-2">
          <PartHeading text={o.factsTitle} />
          {as === "bento" ? (
            <Bento allFacts p={p} showEmpty={o.showEmptyFacts} />
          ) : (
            <FactLooks
              arrange={arrange}
              border={o.factsBorder ?? true}
              look={as as FactsLook}
              p={p}
              showEmpty={o.showEmptyFacts}
            />
          )}
        </div>
      </Boxed>
    );
  // Facts shown as can differ on tablets and phones ("same": as on
  // computers; tablets can also follow phones).
  const phoneAs = keptFactsAs(o.phoneFactsAs ?? "same");
  const tabletAs = keptFactsAs(o.tabletFactsAs ?? "same");
  const phoneDesign = phoneAs === "same" ? factsAs : phoneAs;
  const tabletDesign =
    tabletAs === "same"
      ? factsAs
      : tabletAs === "phone"
        ? phoneDesign
        : tabletAs;
  const factsPart =
    phoneDesign === factsAs &&
    tabletDesign === factsAs &&
    factsAs === "facts" ? (
      factsIn("facts")
    ) : (
      <ByDevice
        computer={{
          as: factsAs,
          arrange: o.factsArrange ?? "fill",
          box: o.factsBox ?? "none",
        }}
        draw={(look) => factsIn(look.as, look.arrange, look.box)}
        phone={{
          as: phoneAs,
          arrange: o.phoneFactsArrange ?? "same",
          box: o.phoneFactsBox ?? "same",
        }}
        tablet={{
          as: tabletAs,
          arrange: o.tabletFactsArrange ?? "same",
          box: o.tabletFactsBox ?? "same",
        }}
      />
    );
  // What's inside the title box under the name, in the chosen order.
  const gap = TITLE_GAP[o.titleGap ?? "normal"] ?? TITLE_GAP.normal;
  const insideParts: Record<TitlePart, ReactNode> = {
    facts: factsInTitle ? factsPart : null,
    essentials: <DeviceEssentials dark={dark} o={o.essentials ?? {}} p={p} />,
    precise: preciseInTitle,
    timeline: timelineView,
    description: descriptionPart,
    map: p.map,
    clockin: p.myClockIn ? (
      <ClockInLook look={o.clockinLook}>{p.myClockIn}</ClockInLook>
    ) : null,
    countdown:
      // "In the status band": it's added to the band's line instead.
      o.countdownLook === "band" ? null : (
        <CountdownLine look={o.countdownLook} p={p} />
      ),
  };
  // Your clock-in and the Countdown can sit right under "Created by",
  // tucked in with the name, instead of in the list's order.
  const tucked = (key: TitlePart) =>
    o.titleExtrasAt === "under-name" &&
    (key === "clockin" || key === "countdown");
  const listed = titleParts.filter((key) => !tucked(key));
  const underName = titleParts.some(tucked) ? (
    // The same small text as "Created by" (the Big number look keeps its size).
    <div className="flex flex-col gap-1.5 [&_p]:text-xs!">
      {titleParts
        .filter(tucked)
        .map((key) =>
          insideParts[key] ? (
            <Fragment key={key}>{insideParts[key]}</Fragment>
          ) : null,
        )}
    </div>
  ) : null;
  const inside =
    listed.length > 0 ? (
      <>
        {listed.map((key) =>
          insideParts[key] ? (
            <Fragment key={key}>{insideParts[key]}</Fragment>
          ) : null,
        )}
      </>
    ) : null;
  const body = (
    <div
      style={factsGapStyle(o.factsGap)}
      className={cn(
        // The same 24px between everything, like the rest of the page.
        "flex min-w-0 flex-col gap-6",
        // A card without a frame has no space inside, so it lines up with
        // the rest of the page (like the Notices page's heading).
        padding === "normal" && "p-6",
        padding === "roomy" && "p-6 sm:p-8",
        o.bigTitle && padding === "normal" && "sm:p-8",
      )}
    >
      {showTitle || showActions ? (
        <Boxed box={titleBox} dark={dark}>
          {titleMessages("top")}
          {titleLook !== "standard" && showTitle ? (
            // One of the title looks (the Title block's), inside the card.
            <div className={cn("flex flex-col", gap.stack)}>
              <Title
                actions={showActions}
                bandMessages={
                  titleMessagesAt === "in-band" &&
                  titleLook.startsWith("band") &&
                  !p.noticesInStrip ? (
                    // Plain: no box, no colour, just the words in the band.
                    <MessagesOrSample
                      className={cn(
                        "gap-1 font-medium text-foreground [&_[data-slot=alert]]:border-0 [&_[data-slot=alert]]:bg-transparent [&_[data-slot=alert]]:p-0 [&_[data-slot=alert]]:text-inherit [&_[data-slot=alert]_*]:text-inherit",
                        ONE_LINE_MESSAGE,
                      )}
                      editing={o.editing ?? false}
                      p={p}
                    />
                  ) : null
                }
                bandStyle={o.bandStyle}
                afterNote={titleLook.startsWith("band") ? inside : null}
                underNote={underName}
                bandCountdown={
                  inTitle("countdown") && o.countdownLook === "band"
                }
                gap={o.titleGap}
                p={p}
                variant={titleLook}
              />
              {!titleLook.startsWith("band") ? inside : null}
            </div>
          ) : (
            /* The name and Manage on one row, then what's inside, full width. */
            <div className={cn("flex flex-col", gap.stack)}>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                {showTitle ? (
                  <div className={cn("flex min-w-0 flex-col", gap.head)}>
                    {(o.statusAt ?? "above") === "above" ? statusRow : null}
                    <h1
                      className={cn(
                        "text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl",
                        o.bigTitle && "sm:text-4xl",
                      )}
                    >
                      {p.headline.title}
                    </h1>
                    {o.statusAt === "below" ? statusRow : null}
                    {/* Created by and anything tucked under it: one group,
                        so they sit as close as the band look's lines. */}
                    {p.headline.note || underName ? (
                      <div className="flex flex-col gap-1.5">
                        {p.headline.note ? (
                          <p
                            className={cn(
                              "text-xs",
                              dark ? "text-white/60" : "text-muted-foreground",
                            )}
                          >
                            {p.headline.note}
                          </p>
                        ) : null}
                        {underName}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <span />
                )}
                {showActions ? <Actions className="sm:shrink-0" p={p} /> : null}
              </div>
              {showTitle ? inside : null}
            </div>
          )}
          {titleMessages("bottom")}
        </Boxed>
      ) : null}
      {descriptionAfterTitle ? descriptionPart : null}
      {o.timeline && !timelineInTitle ? (
        <Boxed box={o.timelineBox} dark={dark}>
          {timelineView}
        </Boxed>
      ) : null}
      {preciseHere("above-facts")}
      {factsInTitle ? null : factsPart}
      {cardExtras}
    </div>
  );
  return (
    <MapLookProvider
      value={{
        buttons: o.mapButtons ?? "below",
        buttonsLook: o.mapButtonsLook ?? "default",
        corners: o.mapCorners ?? "rounded",
        height: o.mapHeight ?? "medium",
        showTitle: o.mapTitle ?? true,
        showNote: o.mapNote ?? true,
        extra:
          preciseAt === "above-map" ||
          preciseAt === "on-map" ||
          preciseAt === "below-map"
            ? precise
            : null,
        extraAt:
          preciseAt === "above-map" || preciseAt === "on-map"
            ? preciseAt
            : "below-map",
      }}
    >
      <section
        aria-label="Walk details"
        className={cn(
          // Clip, not hidden: hidden would stop the side map sticking.
          "overflow-clip",
          o.tone === "plain" ? "" : "rounded-2xl border",
          dark && "border-neutral-800 bg-neutral-950 text-white",
          o.tone === "tint" && "bg-muted/40",
          (!o.tone || o.tone === "card") && "bg-card shadow-sm",
        )}
      >
        {/* The map sits inside the card as its own rounded card, lined up
            with the words (nothing on a designed page runs edge to edge). */}
        {map === "top" && p.map
          ? insetMap(padding === "none" ? "pb-6" : "pt-6")
          : null}
        {map === "side" && p.map ? (
          // Map down the side: whichever side is shorter stays in view
          // (under the site header) while the longer one scrolls past.
          <div
            className={cn(
              "grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start",
              // No map pin: no side column either.
              "lg:has-[>[data-card-map]:empty]:grid-cols-1",
              // With no space inside the card, the two sides need their
              // own 24px gap (otherwise the title box and map touch).
              padding === "none" && "gap-6",
            )}
          >
            <div className="min-w-0 lg:sticky lg:top-24">{body}</div>
            {insetMap(
              cn(
                "lg:sticky lg:top-24 lg:pl-0",
                padding !== "none" && "pb-6 lg:pt-6",
              ),
            )}
          </div>
        ) : (
          body
        )}
        {map === "bottom" && p.map
          ? insetMap(padding === "none" ? "pt-6" : "pb-6")
          : null}
      </section>
    </MapLookProvider>
  );
}

export function FactsBlock({
  variant = "grid",
  arrange = "fill",
  phoneVariant = "same",
  phoneArrange = "same",
  tabletVariant = "same",
  tabletArrange = "same",
  showEmpty = false,
  box = "none",
  phoneBox = "same",
  tabletBox = "same",
  lines = "between",
  heading = "",
  gap,
  design = "facts",
  border = true,
}: {
  /** Plain facts (the looks below), or one of the Details card's Facts
   * shown as designs (Spec sheet, Card table, colour blocks…). */
  design?: string;
  /** Spec sheet / Card table: the frame round them all. */
  border?: boolean;
  gap?: FactsGap;
  lines?: FactLines;
  heading?: string;
  variant?: FactsVariant;
  arrange?: Arrange;
  phoneVariant?: FactsVariant | "same";
  phoneArrange?: Arrange | "same";
  tabletVariant?: FactsVariant | "same" | "phone";
  tabletArrange?: Arrange | "same" | "phone";
  showEmpty?: boolean;
  box?: PartBox;
  phoneBox?: PartBox | "same";
  tabletBox?: ForDevice<PartBox>;
}) {
  const p = useWalkParts();
  const chosen = keptFactsAs(design);
  if (p && chosen !== "facts" && chosen !== "none" && chosen !== "bento")
    return (
      <div className="flex flex-col gap-2" style={factsGapStyle(gap)}>
        <PartHeading text={heading} />
        <FactLooks
          arrange={arrange}
          border={border}
          look={chosen as FactsLook}
          p={p}
          showEmpty={showEmpty}
        />
      </div>
    );
  return p ? (
    <div style={factsGapStyle(gap)}>
      <DeviceFacts
        arrange={arrange}
        p={p}
        phoneArrange={phoneArrange}
        phoneVariant={phoneVariant}
        showEmpty={showEmpty}
        tabletArrange={tabletArrange}
        tabletVariant={tabletVariant}
        variant={variant}
        box={box}
        heading={heading}
        lines={lines}
        phoneBox={phoneBox}
        tabletBox={tabletBox}
      />
    </div>
  ) : (
    <Placeholder label={`Facts · ${variant}`} />
  );
}

export function EssentialsBlock(o: EssentialsOptions) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Essentials" />;
  return <DeviceEssentials o={o} p={p} />;
}
/** A heading of your own above one part of the Details card (blank: none). */
function PartHeading({ text }: { text?: string }) {
  const title = text?.trim();
  return title ? <h2 className="text-base font-semibold">{title}</h2> : null;
}

/** The walk's description, with a heading of your own above it if one is set. */
function DescriptionWithHeading({
  description,
  heading,
}: {
  description: string;
  heading?: string;
}) {
  const title = heading?.trim();
  if (!title) return <WalkDescription description={description} />;
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <WalkDescription description={description} />
    </div>
  );
}

export function DescriptionBlock({ heading = "" }: { heading?: string }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Description" />;
  return p.walk.description ? (
    <DescriptionWithHeading
      description={p.walk.description}
      heading={heading}
    />
  ) : null;
}

export type ActionsShow = "both" | "manage" | "clock";

/**
 * Clock in and Manage together, or either one alone. Clock in only shows
 * while it can be used — switch the designer's preview to Clock-in open to
 * see it. Members' clocking in is in the Clock-in panel instead.
 */
export function ActionsBlock({
  align = "start",
  show = "both",
}: {
  align?: "start" | "end" | "full";
  show?: ActionsShow;
}) {
  const p = useWalkParts();
  const label =
    show === "clock"
      ? "Clock in button (while clock-in is open)"
      : show === "manage"
        ? "Manage button"
        : "Clock in + Manage";
  if (!p) return <Placeholder label={label} />;
  return (
    <div
      className={cn(
        "flex",
        align === "end" && "sm:justify-end",
        align === "full" && "[&>*]:w-full [&_button]:w-full",
      )}
    >
      {show === "clock" ? (
        p.liveCompact ? (
          <div>{p.liveCompact}</div>
        ) : null
      ) : (
        <Actions p={show === "manage" ? { ...p, liveCompact: null } : p} />
      )}
    </div>
  );
}

export type StatusVariant =
  | "line"
  | "box"
  | "band"
  | "takeover"
  | "stepper"
  | "timeline"
  | "ring"
  | "numbers"
  | "phases";

export function StatusBlock({ variant = "box" }: { variant?: StatusVariant }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label={`Status · ${variant}`} />;
  return <Status p={p} variant={variant} />;
}

function Status({ p, variant }: { p: WalkIdeaParts; variant: StatusVariant }) {
  const info = useWalkInfo(p);
  const h = p.headline;
  switch (variant) {
    case "line":
      return <StatusLine p={p} />;
    case "band":
      return (
        <div
          aria-hidden
          className={cn(
            "h-2 rounded-full",
            info.now.live ? "bg-emerald-500" : "bg-muted-foreground/30",
          )}
        />
      );
    case "takeover":
      return (
        <section
          className={cn(
            "flex flex-col items-center gap-2 rounded-3xl px-6 py-10 text-center",
            info.now.tone,
          )}
        >
          <span
            className="text-sm font-bold tracking-widest uppercase"
            suppressHydrationWarning
          >
            {info.now.eyebrow}
          </span>
          <span
            className="text-7xl leading-none font-black tracking-tighter sm:text-8xl"
            suppressHydrationWarning
          >
            {info.countdown.value}
          </span>
          <span className="text-sm font-semibold" suppressHydrationWarning>
            {info.countdown.unit}
          </span>
        </section>
      );
    case "stepper": {
      const order = ["upcoming", "starting-soon", "in-progress", "completed"];
      const reached =
        info.status === "cancelled" ? -1 : order.indexOf(info.status);
      return (
        <ol
          aria-label="Where the walk is up to"
          className="grid grid-cols-4 gap-2"
        >
          {["Upcoming", "Clock-in open", "In progress", "Finished"].map(
            (step, i) => (
              <li className="flex flex-col gap-1.5" key={step}>
                <span
                  className={cn(
                    "h-1.5 rounded-full",
                    i <= reached ? "bg-emerald-600" : "bg-muted",
                  )}
                />
                <span
                  className={cn(
                    "text-xs sm:text-sm",
                    i === reached ? "font-semibold" : "text-muted-foreground",
                  )}
                  suppressHydrationWarning
                >
                  {step}
                </span>
              </li>
            ),
          )}
        </ol>
      );
    }
    case "timeline":
      return (
        <section className="rounded-xl border p-4 sm:p-5">
          <Timeline p={p} />
        </section>
      );
    case "ring": {
      const r = 52;
      const c = 2 * Math.PI * r;
      return (
        <div className="relative size-36 shrink-0">
          <svg
            aria-hidden
            className="size-full -rotate-90"
            viewBox="0 0 120 120"
          >
            <circle
              className="stroke-muted"
              cx="60"
              cy="60"
              fill="none"
              r={r}
              strokeWidth="10"
            />
            <circle
              className="stroke-emerald-600"
              cx="60"
              cy="60"
              fill="none"
              r={r}
              strokeDasharray={c}
              strokeDashoffset={c * (1 - info.progress / 100)}
              strokeLinecap="round"
              strokeWidth="10"
            />
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            suppressHydrationWarning
          >
            <span className="text-3xl font-bold">{info.countdown.value}</span>
            <span className="text-xs text-muted-foreground">
              {info.countdown.unit}
            </span>
          </div>
        </div>
      );
    }
    case "numbers":
      return (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y py-5 sm:grid-cols-4">
          {[
            {
              label: info.status === "in-progress" ? "Time left" : "Countdown",
              value: info.countdown.value,
              unit: info.countdown.unit,
            },
            ...(p.attended?.count != null
              ? [
                  {
                    label: "Clocked in",
                    value: String(p.attended.count),
                    unit: "people",
                  },
                ]
              : []),
            ...(h.distance
              ? [{ label: "Distance", value: h.distance, unit: "" }]
              : []),
            ...(h.elevationGain
              ? [{ label: "Climb", value: h.elevationGain, unit: "" }]
              : []),
            ...(h.grade ? [{ label: "Grade", value: h.grade, unit: "" }] : []),
          ]
            .slice(0, 4)
            .map((stat) => (
              <div className="flex min-w-0 flex-col gap-1" key={stat.label}>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {stat.label}
                </dt>
                <dd
                  className="truncate text-4xl leading-none font-bold tracking-tight sm:text-5xl"
                  suppressHydrationWarning
                >
                  {stat.value}
                </dd>
                {stat.unit ? (
                  <dd className="text-xs text-muted-foreground">{stat.unit}</dd>
                ) : null}
              </div>
            ))}
        </dl>
      );
    case "phases": {
      const current =
        info.status === "completed"
          ? "after"
          : info.status === "in-progress"
            ? "during"
            : "before";
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              id: "before",
              title: "Before",
              text: "Map, weather and what to bring",
            },
            {
              id: "during",
              title: "During",
              text: "Clock in and who's on the walk",
            },
            {
              id: "after",
              title: "After",
              text: "Who attended and the journey",
            },
          ].map((phase) => (
            <section
              className={cn(
                "flex flex-col gap-1 rounded-xl border p-4",
                phase.id === current
                  ? "border-2 border-emerald-700 bg-emerald-50 dark:bg-emerald-950"
                  : "opacity-70",
              )}
              key={phase.id}
            >
              <h2 className="text-xs font-semibold tracking-wider uppercase">
                {phase.title}
                {phase.id === current ? " · now" : ""}
              </h2>
              <p className="text-sm text-muted-foreground">{phase.text}</p>
            </section>
          ))}
        </div>
      );
    }
    default:
      return (
        <section
          className={cn(
            "flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
            info.now.tone,
          )}
        >
          <div className="flex flex-col gap-0.5" suppressHydrationWarning>
            <span className="text-xs font-semibold tracking-wider uppercase">
              {info.now.eyebrow}
            </span>
            <span className="text-lg font-semibold">{info.now.line}</span>
          </div>
        </section>
      );
  }
}

/** The meeting-point map, in the look and with the buttons chosen in the designer. */
export function MapBlock({
  preciseAt = "none",
  preciseLook,
  ...look
}: MapLook & {
  preciseAt?: "none" | "above-map" | "on-map" | "below-map" | "after";
  preciseLook?: PreciseLook;
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Map and directions" />;
  const precise =
    p.what3words && preciseAt !== "none" ? (
      <PreciseLocation
        address={p.what3words}
        look={preciseLook ?? (preciseAt === "on-map" ? "compact" : "card")}
      />
    ) : null;
  return (
    <MapLookProvider
      value={{
        ...look,
        extra: precise,
        extraAt: preciseAt === "none" ? undefined : preciseAt,
      }}
    >
      {p.map}
    </MapLookProvider>
  );
}

/** Get directions and Apple Maps on their own, to place anywhere. */
export function DirectionsBlock({
  full = false,
  look = "default",
}: {
  full?: boolean;
  look?: DirectionsLook;
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Directions buttons" />;
  if (!p.meeting) return null;
  return (
    <DirectionsButtons
      className={full ? "sm:grid sm:grid-cols-2" : undefined}
      location={p.meeting}
      look={look}
    />
  );
}
export const WeatherBlock = withParts("Weather forecast", (p) => (
  <>{p.forecast}</>
));
export const PreciseBlock = withParts("Precise location (what3words)", (p) => (
  <>{p.precise}</>
));
export type BeforeLook =
  | "card"
  | "ticks"
  | "numbered"
  | "callout"
  | "tiles"
  | "swipe"
  | "compact"
  | "row"
  | "big-numbers"
  | "list"
  | "card-list"
  | "timeline"
  | "two-columns"
  | "grey-row"
  | "outline-row"
  | "boxed-ticks"
  | "boxed-numbers"
  | "chips"
  | "number-cards";

/** The full-width looks, drawn by StepsLooks for both blocks. */
const WIDE_STEP_LOOKS: readonly string[] = [
  "row",
  "big-numbers",
  "list",
  "card-list",
  "timeline",
  "two-columns",
  "grey-row",
  "outline-row",
  "boxed-ticks",
  "boxed-numbers",
  "chips",
  "number-cards",
];

/**
 * Before you set off, in a chosen look. It shows when the walk page's own
 * card would (turned on in Settings, the walk not cancelled or finished);
 * "card" is that card exactly as it is.
 */
export function BeforeBlock({
  look = "card",
  title = "",
  showHeading = true,
}: {
  look?: BeforeLook;
  title?: string;
  /** Off: no heading at all (the Card look keeps its own). */
  showHeading?: boolean;
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label={`Before you set off · ${look}`} />;
  if (!p.before) return null;
  if (look === "card") return <>{p.before}</>;
  if (WIDE_STEP_LOOKS.includes(look))
    return (
      <StepsLooks
        heading={showHeading ? title.trim() || "Before you set off" : ""}
        look={look as Exclude<BeforeLook, "card">}
        p={p}
        steps={p.tips.map((tip) => ({ title: tip, body: "" }))}
      />
    );
  return (
    <BeforeTips
      heading={showHeading ? title.trim() || "Before you set off" : ""}
      look={look}
      p={p}
    />
  );
}

function BeforeTips({
  p,
  look,
  heading,
}: {
  p: WalkIdeaParts;
  look: Exclude<BeforeLook, "card">;
  /** Blank: no heading. */
  heading: string;
}) {
  const { status } = useWalkInfo(p);
  if (status === "completed" || status === "cancelled") return null;
  const tips = p.tips;
  if (look === "compact")
    return (
      <p className="text-sm text-muted-foreground">
        {heading ? (
          <span className="font-semibold text-foreground">{heading}: </span>
        ) : null}
        {tips.join(" · ")}
      </p>
    );
  if (look === "tiles" || look === "swipe")
    return (
      <section className="flex flex-col gap-3">
        {heading ? (
          <h2 className="text-base font-semibold">{heading}</h2>
        ) : null}
        <ol
          className={cn(
            "grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
            look === "swipe" && cn(SWIPE, "gap-3 [&>*]:w-60"),
          )}
        >
          {tips.map((tip, i) => (
            <li
              className="flex gap-3 rounded-xl bg-muted/60 p-3 text-sm"
              key={tip}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ol>
      </section>
    );
  return (
    <section
      className={cn(
        "flex flex-col gap-3",
        look === "callout" &&
          "rounded-lg border-l-4 border-foreground/20 bg-muted/60 p-5",
      )}
    >
      {heading ? <h2 className="text-base font-semibold">{heading}</h2> : null}
      <ol className="flex flex-col gap-2 text-sm">
        {tips.map((tip, i) => (
          <li className="flex items-start gap-2.5" key={tip}>
            {look === "numbered" ? (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                {i + 1}
              </span>
            ) : (
              <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
            )}
            <span>{tip}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function AttendedBlock({
  rule = "clocked-in",
}: {
  rule?: AttendedRule;
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Attended (who's on the walk)" />;
  return (
    <AttendedRuleContext.Provider value={rule}>
      {p.attended?.content ?? null}
    </AttendedRuleContext.Provider>
  );
}
export const JourneyBlock = withParts("Journey", (p) => (
  <>{p.journey?.content ?? null}</>
));

/** The facts a summary tile can show, by setting value → fact label. */
const TILE_FACTS: Record<string, string> = {
  date: "Date",
  starts: "Starts",
  finishes: "Finishes",
  length: "Length",
  what3words: "what3words",
  distance: "Distance",
  climb: "Climb",
  grade: "Grade",
  leader: "Walk leader",
  "back-marker": "Back marker",
  refreshment: "Refreshment stop",
};
export const DEFAULT_SUMMARY_TILES = [
  "attended",
  "meeting",
  "weather",
  "journey",
];

export function SummaryTilesBlock({
  arrange = "fill",
  tiles,
}: {
  arrange?: Arrange;
  /** Which tiles, in order (the block's Tiles list). */
  tiles?: { tile?: string }[];
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Summary tiles" />;
  return <SummaryTiles arrange={arrange} chosen={tiles} p={p} />;
}

function SummaryTiles({
  arrange,
  chosen,
  p,
}: {
  arrange: Arrange;
  chosen?: { tile?: string }[];
  p: WalkIdeaParts;
}) {
  const { facts } = useWalkInfo(p);
  const keys = Array.isArray(chosen)
    ? chosen.map((item) => String(item?.tile ?? ""))
    : DEFAULT_SUMMARY_TILES;
  const builtIn = [
    ...(p.attended
      ? [
          {
            icon: Users,
            label: "Attended",
            value:
              p.attended.count == null ? "See who" : String(p.attended.count),
          },
        ]
      : []),
    ...(p.meeting
      ? [{ icon: MapPin, label: "Meeting point", value: p.meeting }]
      : []),
    { icon: CloudSun, label: "Weather", value: "Forecast for the day" },
    ...(p.journey
      ? [
          {
            icon: Footprints,
            label: "Journey",
            value: `${p.journey.count} moments`,
          },
        ]
      : []),
  ];
  // The chosen tiles, in order: the built-in four and any walk fact (only
  // facts that are filled in; each tile once).
  const byKey = (key: string) => {
    if (key === "attended") return builtIn.find((t) => t.label === "Attended");
    if (key === "meeting")
      return builtIn.find((t) => t.label === "Meeting point");
    if (key === "weather") return builtIn.find((t) => t.label === "Weather");
    if (key === "journey") return builtIn.find((t) => t.label === "Journey");
    const fact = facts.find((f) => f.label === TILE_FACTS[key]);
    return fact
      ? { icon: fact.icon, label: fact.label, value: String(fact.value) }
      : undefined;
  };
  const tiles = keys
    .filter((key, i) => keys.indexOf(key) === i)
    .map(byKey)
    .filter((tile): tile is NonNullable<typeof tile> => Boolean(tile));
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]",
        arrange === "scroll" && cn(SWIPE, "[&>*]:w-48"),
      )}
    >
      {tiles.map((tile) => (
        <div
          className="flex min-w-0 flex-col gap-1 rounded-xl border p-4"
          key={tile.label}
        >
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <tile.icon aria-hidden className="size-3.5" />
            {tile.label}
          </span>
          <span
            className="truncate text-xl font-semibold"
            suppressHydrationWarning
          >
            {tile.value}
          </span>
          <ChevronRight
            aria-hidden
            className="size-3.5 text-muted-foreground"
          />
        </div>
      ))}
    </div>
  );
}

export function PeopleStackBlock() {
  const p = useWalkParts();
  if (!p) return <Placeholder label="People clocked in (count)" />;
  // Real profile photos where the page has them (and the viewer may see).
  if (p.peopleStack) return <>{p.peopleStack}</>;
  if (!p.attended?.count) return null;
  return (
    <div className="flex items-center gap-2">
      <div aria-hidden className="flex -space-x-2">
        {Array.from({ length: Math.min(4, p.attended.count) }).map((_, i) => (
          <span
            className={cn(
              "size-7 rounded-full border-2 border-background",
              ["bg-emerald-200", "bg-amber-200", "bg-sky-200", "bg-rose-200"][
                i
              ],
            )}
            key={i}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {p.attended.count} clocked in
      </span>
    </div>
  );
}

// ── Layout blocks ───────────────────────────────────────────────────────
/**
 * A sidebar beside the page on a computer; on a phone it opens from a button
 * as a panel over the page (✕, a tap outside, or Escape closes it).
 */
export function MobileSidebar({
  children,
  label,
  side = "left",
}: {
  children: ReactNode;
  label: string;
  side?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <Button
        className="w-full lg:hidden"
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="outline"
      >
        <PanelLeft data-icon="inline-start" />
        {label}
      </Button>
      {open ? (
        <div
          aria-hidden
          className="fixed inset-0 z-[70] bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside
        aria-label={label}
        className={cn(
          "lg:static lg:block lg:min-w-0",
          open
            ? cn(
                "fixed inset-y-0 z-[71] block w-80 max-w-[85vw] overflow-y-auto bg-background p-4 shadow-xl lg:w-auto lg:bg-transparent lg:p-0 lg:shadow-none",
                side === "right" ? "right-0" : "left-0",
              )
            : "hidden",
        )}
      >
        {open ? (
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <span className="text-sm font-semibold">{label}</span>
            <Button
              aria-label="Close"
              onClick={() => setOpen(false)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X />
            </Button>
          </div>
        ) : null}
        {children}
      </aside>
    </>
  );
}

// ── More blocks from the walk page designs ──────────────────────────────
export type HowItWorksAudience = "visitors" | "members" | "everyone";

export function HowItWorksBlock({
  editing = false,
  look = "card",
  title = "",
  showTo = "visitors",
  showHeading = true,
}: {
  /** Off: no heading at all (the Card look for visitors keeps its own). */
  showHeading?: boolean;
  editing?: boolean;
  look?: BeforeLook;
  title?: string;
  /** Who sees it: signed-out visitors (the default), members, or everyone. */
  showTo?: HowItWorksAudience;
}) {
  const p = useWalkParts();
  if (!p)
    return <Placeholder label={`How this group works (${showTo}) · ${look}`} />;
  const steps = p.howItWorksSteps ?? [];
  // The page's own card (visitors only, when on in Settings), as it is.
  if (look === "card" && showTo === "visitors" && p.howItWorks)
    return <>{p.howItWorks}</>;
  if (steps.length === 0)
    return editing ? (
      <Placeholder label="How this group works: no steps yet (Settings → Site wording → Walk page cards)" />
    ) : null;
  const drawn = (
    <StepsLooks
      heading={showHeading ? title.trim() || "How this group works" : ""}
      // The card look for members or everyone: the steps in a plain box.
      look={look === "card" ? "card-list" : look}
      p={p}
      steps={steps}
    />
  );
  if (showTo === "everyone") return drawn;
  return (
    <div
      className="contents"
      data-guest-home={showTo === "visitors" ? "" : undefined}
      data-member-home={showTo === "members" ? "" : undefined}
    >
      {drawn}
    </div>
  );
}

/** Cards to swipe through: when, where, weather, people, journey. */
export function StoryCardsBlock({ arrange = "fill" }: { arrange?: Arrange }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Story cards" />;
  return <StoryCards arrange={arrange} p={p} />;
}

function StoryCards({ p, arrange }: { p: WalkIdeaParts; arrange: Arrange }) {
  const info = useWalkInfo(p);
  const cards = [
    {
      icon: CalendarDays,
      label: "When",
      value: `${formatWalkDay(info.start)}, ${formatTime(info.start)}`,
      sub: `Back by ${formatTime(info.end)}`,
      tone: "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-50",
    },
    {
      icon: MapPin,
      label: "Where",
      value: p.meeting ?? "—",
      sub: p.what3words ? `///${p.what3words}` : "Map and directions",
      tone: "bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50",
    },
    {
      icon: CloudSun,
      label: "Weather",
      value: "Forecast",
      sub: "Hour by hour for the walk",
      tone: "bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-50",
    },
    ...(p.attended
      ? [
          {
            icon: Users,
            label: "People",
            value:
              p.attended.count == null ? "See who" : `${p.attended.count} in`,
            sub: "Who's on the walk",
            tone: "bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-50",
          },
        ]
      : []),
    ...(p.journey
      ? [
          {
            icon: Footprints,
            label: "Journey",
            value: `${p.journey.count}`,
            sub: "moments so far",
            tone: "bg-violet-100 text-violet-950 dark:bg-violet-950 dark:text-violet-50",
          },
        ]
      : []),
  ];
  return (
    <div
      className={
        arrange === "scroll"
          ? cn(SWIPE, "gap-3 [&>*]:w-44 sm:[&>*]:w-52")
          : arrange === "grid"
            ? "grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]"
            : cn(STRETCH, "gap-3 [&>*]:basis-36")
      }
    >
      {cards.map((card) => (
        <div
          className={cn(
            "flex min-w-0 flex-col justify-between gap-6 rounded-2xl p-4",
            card.tone,
          )}
          key={card.label}
        >
          <card.icon aria-hidden className="size-5" />
          <span className="flex flex-col">
            <span className="text-xs font-semibold uppercase opacity-70">
              {card.label}
            </span>
            <span
              className="truncate text-lg font-semibold"
              suppressHydrationWarning
            >
              {card.value}
            </span>
            <span className="truncate text-xs opacity-70">{card.sub}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Boxes of different sizes: the walk, Clock in + Manage, meeting point, people, walk numbers. */
export function BentoBlock() {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Bento grid" />;
  return <Bento p={p} />;
}

function Bento({
  p,
  allFacts = false,
  showEmpty = false,
}: {
  p: WalkIdeaParts;
  /** Every fact from Edit walk as tiles (the Details card). */
  allFacts?: boolean;
  showEmpty?: boolean;
}) {
  const info = useWalkInfo(p, showEmpty);
  const h = p.headline;
  const tile = (
    label: string,
    value: string,
    sub?: string | null,
    wide = false,
  ) => (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-2xl border p-4",
        wide && "sm:col-span-2",
      )}
      key={label}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className="truncate text-2xl font-semibold"
        suppressHydrationWarning
      >
        {value}
      </span>
      {sub ? (
        <span className="truncate text-xs text-muted-foreground">{sub}</span>
      ) : null}
    </div>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <section className="flex flex-col gap-1 rounded-2xl bg-muted/60 p-5 sm:col-span-3">
        <StatusLine p={p} />
        <h2 className="text-xl font-semibold sm:text-2xl">{h.title}</h2>
        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
          {formatWalkDay(info.start)}, {formatTime(info.start)} to{" "}
          {formatTime(info.end)}
        </p>
      </section>
      <section className="flex flex-col justify-between gap-3 rounded-2xl border p-4 [&_button]:w-full">
        <span className="text-sm text-muted-foreground">Actions</span>
        <Actions p={p} />
      </section>
      {allFacts
        ? info.facts.map((fact) =>
            tile(fact.label, fact.value, null, fact.wide),
          )
        : null}
      {allFacts ? null : (
        <>
          {tile(
            "Meeting point",
            p.meeting ?? "—",
            p.what3words ? `///${p.what3words}` : null,
            true,
          )}
          {p.attended
            ? tile(
                "Attended",
                p.attended.count == null ? "See who" : String(p.attended.count),
              )
            : null}
          {tile(
            "Walk",
            [h.distance, h.grade].filter(Boolean).join(" · ") ||
              formatWalkLength(h.durationMins),
            h.elevationGain,
          )}
        </>
      )}
    </div>
  );
}

export type TicketVariant = "plain" | "colour";

/** A walk pass: date and times like a ticket, Clock in + Manage on its stub. */
export function TicketBlock({
  variant = "plain",
}: {
  variant?: TicketVariant;
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label={`Walk ticket · ${variant}`} />;
  return <Ticket p={p} variant={variant} />;
}

function Ticket({
  p,
  variant,
  allFacts = false,
  showEmpty = false,
  extra,
  arrange,
}: {
  p: WalkIdeaParts;
  variant: TicketVariant;
  /** Every fact from Edit walk (the Details card), not just the ticket's six. */
  allFacts?: boolean;
  showEmpty?: boolean;
  /** More of the walk inside the ticket (the Details card's essentials, description…). */
  extra?: ReactNode;
  /** Its facts in a swiping row or carousel, when chosen. */
  arrange?: Arrange;
}) {
  const info = useWalkInfo(p, showEmpty);
  const colour = variant === "colour";
  const rows = (
    allFacts
      ? info.facts.map((fact) => [fact.label, fact.value])
      : [
          ["Date", formatWalkDay(info.start)],
          ["Sets off", formatTime(info.start)],
          ["Back by", formatTime(info.end)],
          ["Meet at", p.meeting],
          ["Distance", p.headline.distance],
          ["Leader", p.headline.walkLeader],
        ]
  ).filter(([, value]) => value) as [string, string][];
  return (
    <section
      className={cn(
        "grid overflow-hidden rounded-2xl shadow-sm sm:grid-cols-[minmax(0,1fr)_14rem]",
        colour ? "bg-sky-600 text-white" : "border bg-card",
      )}
    >
      {/* The same 24px between everything, like the rest of the page. */}
      <div className="flex min-w-0 flex-col gap-6 p-6">
        <span
          className={cn(
            "text-xs font-semibold tracking-widest uppercase",
            colour ? "opacity-80" : "text-muted-foreground",
          )}
        >
          Walk pass
        </span>
        <h2 className="text-2xl leading-tight font-semibold sm:text-3xl">
          {p.headline.title}
        </h2>
        <MaybeRow arrange={arrange}>
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {rows.map(([label, value]) => (
              <div className="flex min-w-0 flex-col" key={label}>
                <dt
                  className={cn(
                    "text-[11px] tracking-wide uppercase",
                    colour ? "opacity-70" : "text-muted-foreground",
                  )}
                >
                  {label}
                </dt>
                <dd
                  className="truncate text-lg font-semibold"
                  suppressHydrationWarning
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </MaybeRow>
        {extra}
      </div>
      <div
        className={cn(
          "flex flex-col justify-between gap-6 border-t-2 border-dashed p-6 sm:border-t-0 sm:border-l-2",
          colour && "border-white/40 bg-sky-700",
        )}
      >
        <span className="flex flex-col" suppressHydrationWarning>
          <span className="text-4xl font-black">{info.countdown.value}</span>
          <span
            className={cn(
              "text-xs uppercase",
              colour ? "opacity-80" : "text-muted-foreground",
            )}
          >
            {info.countdown.unit}
          </span>
        </span>
        <div className="[&_button]:w-full">
          <Actions p={p} />
        </div>
      </div>
    </section>
  );
}

/** Before, During and After as columns holding the real parts; the current one stands out. */
export function PhasesBoardBlock() {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Phases board (Before · During · After)" />;
  return <PhasesBoard p={p} />;
}

function PhasesBoard({ p }: { p: WalkIdeaParts }) {
  const info = useWalkInfo(p);
  const current =
    info.status === "completed"
      ? "after"
      : info.status === "in-progress"
        ? "during"
        : "before";
  const column = (id: string, heading: string, content: ReactNode) => (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-2xl border p-4",
        id === current
          ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 dark:bg-emerald-950/30"
          : "bg-muted/20",
      )}
      key={id}
    >
      <h2 className="flex items-center justify-between text-sm font-semibold">
        {heading}
        {id === current ? (
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] text-white">
            Now
          </span>
        ) : null}
      </h2>
      {content}
    </section>
  );
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {column(
        "before",
        "Before",
        <>
          {p.map}
          {p.forecast}
          {p.before}
        </>,
      )}
      {column(
        "during",
        "During",
        <>
          {p.precise}
          {p.attended?.content ?? null}
        </>,
      )}
      {column(
        "after",
        "After",
        p.journey?.content ?? (
          <p className="text-sm text-muted-foreground">
            The journey will appear here.
          </p>
        ),
      )}
    </div>
  );
}

/** The key facts as a grid of coloured blocks. */
export function ColourBlocksBlock({ arrange = "fill" }: { arrange?: Arrange }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Colour blocks" />;
  return <ColourBlocks arrange={arrange} p={p} />;
}

function ColourBlocks({ p, arrange }: { p: WalkIdeaParts; arrange: Arrange }) {
  const info = useWalkInfo(p);
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-4",
        arrange === "scroll" && cn(SWIPE, "[&>*]:w-48"),
      )}
    >
      <div
        className={cn(
          "col-span-2 flex flex-col justify-between gap-6 rounded-2xl p-5",
          info.now.tone,
        )}
        suppressHydrationWarning
      >
        <span className="text-xs font-bold uppercase">{info.now.eyebrow}</span>
        <span className="text-xl font-bold">{info.now.line}</span>
      </div>
      <div
        className="flex flex-col justify-between gap-6 rounded-2xl bg-amber-300 p-5 text-amber-950"
        suppressHydrationWarning
      >
        <Clock aria-hidden className="size-5" />
        <span className="text-2xl font-bold">{formatTime(info.start)}</span>
      </div>
      <div className="flex flex-col justify-between gap-6 rounded-2xl bg-sky-300 p-5 text-sky-950">
        <Footprints aria-hidden className="size-5" />
        <span className="text-2xl font-bold">
          {p.headline.distance ?? formatWalkLength(p.headline.durationMins)}
        </span>
      </div>
      <div className="col-span-2 flex flex-col justify-between gap-6 rounded-2xl bg-rose-300 p-5 text-rose-950">
        <MapPin aria-hidden className="size-5" />
        <span className="truncate text-lg font-bold">{p.meeting ?? "—"}</span>
      </div>
      <div className="col-span-2 flex flex-col justify-between gap-6 rounded-2xl bg-violet-300 p-5 text-violet-950">
        <TrendingUp aria-hidden className="size-5" />
        <span className="truncate text-lg font-bold">
          {[p.headline.grade, p.headline.elevationGain]
            .filter(Boolean)
            .join(" · ") || "—"}
        </span>
      </div>
    </div>
  );
}

/** Round badges for the walk's numbers. */
export function BadgesBlock({ arrange = "fill" }: { arrange?: Arrange }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Round badges" />;
  const h = p.headline;
  const start = new Date(h.startsAt);
  const badges = [
    {
      label: "Grade",
      value: h.grade ?? "—",
      tone: "bg-emerald-500 text-white",
    },
    {
      label: "Distance",
      value: h.distance ?? "—",
      tone: "bg-sky-500 text-white",
    },
    {
      label: "Climb",
      value: h.elevationGain ?? "—",
      tone: "bg-amber-500 text-amber-950",
    },
    {
      label: "Starts",
      value: formatTime(start),
      tone: "bg-rose-500 text-white",
    },
    {
      label: "Hours",
      value: (h.durationMins / 60).toFixed(1).replace(/\.0$/, ""),
      tone: "bg-violet-500 text-white",
    },
  ];
  return (
    <div
      className={
        arrange === "scroll"
          ? cn(SWIPE, "gap-4 py-1")
          : "flex flex-wrap justify-between gap-4"
      }
    >
      {badges.map((badge) => (
        <div
          className={cn(
            "flex size-24 flex-col items-center justify-center rounded-full text-center shadow-md ring-4 ring-background",
            badge.tone,
          )}
          key={badge.label}
        >
          <span
            className="max-w-20 truncate text-lg leading-tight font-black"
            suppressHydrationWarning
          >
            {badge.value}
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">
            {badge.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Single pieces, to place anywhere ─────────────────────────────────────
export const FACT_NAMES = [
  "Date",
  "Starts",
  "Finishes",
  "Length",
  "Meeting point",
  "what3words",
  "Distance",
  "Climb",
  "Grade",
  "Walk leader",
  "Back marker",
  "Refreshment stop",
] as const;
export type FactName = (typeof FACT_NAMES)[number];
export type FactLook = "line" | "tile" | "big";

/** One fact on its own (members only see it when it's filled in). */
export function FactBlock({
  fact = "Date",
  look = "tile",
}: {
  fact?: FactName;
  look?: FactLook;
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label={`Fact · ${fact}`} />;
  return <OneFact fact={fact} look={look} p={p} />;
}

function OneFact({
  p,
  fact,
  look,
}: {
  p: WalkIdeaParts;
  fact: FactName;
  look: FactLook;
}) {
  const found = useWalkInfo(p).facts.find((item) => item.label === fact);
  if (!found) return null;
  if (look === "line")
    return (
      <p className="flex items-center gap-2 text-sm" suppressHydrationWarning>
        <found.icon aria-hidden className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">{found.label}</span>
        <span className="font-medium">{found.value}</span>
      </p>
    );
  if (look === "big")
    return (
      <div className="flex flex-col">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <found.icon aria-hidden className="size-4" />
          {found.label}
        </span>
        <span
          className="text-3xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-4xl"
          suppressHydrationWarning
        >
          {found.value}
        </span>
      </div>
    );
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl bg-muted/60 p-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <found.icon aria-hidden className="size-3.5" />
        {found.label}
      </span>
      <span
        className="text-sm font-semibold [overflow-wrap:anywhere]"
        suppressHydrationWarning
      >
        {found.value}
      </span>
    </div>
  );
}

export type CountdownLook = "big" | "box" | "pill";

/** How long until the walk sets off (or finishes, while it's under way). */
export type LineLook =
  | "line"
  | "grey"
  | "pill"
  | "outline"
  | "bar"
  | "big"
  | "band"
  | "tick"
  | "badge"
  | "card"
  | "stacked"
  | "underline";

/** The box each line look puts around Your clock-in or the Countdown. */
const LINE_LOOK: Record<LineLook, string> = {
  line: "",
  grey: "rounded-lg bg-muted px-3 py-2",
  pill: "w-fit rounded-full bg-muted px-3 py-1",
  outline: "rounded-lg border px-3 py-2",
  bar: "border-l-4 border-foreground/20 bg-muted/50 px-3 py-2",
  big: "",
  band: "",
  tick: "",
  badge: "w-fit rounded-full border px-3 py-1",
  card: "rounded-lg border bg-card px-4 py-3 shadow-sm",
  // Status on one line, "Recorded at…" under it (no dot between).
  stacked:
    "items-start rounded-lg bg-muted px-4 py-3 [&_p>span]:block [&_p>span:last-child]:text-xs [&_[data-dot]]:hidden",
  underline: "border-b pb-2",
};

/** One line, e.g. "3 days to go" or "48 min left"; nothing once it's over. */
function CountdownLine({
  p,
  look = "line",
}: {
  p: WalkIdeaParts;
  look?: LineLook;
}) {
  const { countdown, status } = useWalkInfo(p);
  if (status === "completed" || status === "cancelled") return null;
  if (look === "big")
    return (
      <p className="flex items-baseline gap-2" suppressHydrationWarning>
        <span className="text-3xl font-semibold tracking-tight tabular-nums">
          {countdown.value}
        </span>
        <span className="text-sm text-muted-foreground">{countdown.unit}</span>
      </p>
    );
  return (
    <p
      className={cn("flex items-center gap-2 text-sm", LINE_LOOK[look])}
      suppressHydrationWarning
    >
      {look === "pill" ? (
        <Clock aria-hidden className="size-3.5 text-muted-foreground" />
      ) : null}
      <span>
        <span className="font-semibold tabular-nums">{countdown.value}</span>{" "}
        <span className="text-muted-foreground">{countdown.unit}</span>
      </span>
    </p>
  );
}

/** Your clock-in in a look; hidden whole until there's a line to show. */
function ClockInLook({
  look = "line",
  children,
}: {
  look?: LineLook;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 [&:not(:has(p))]:hidden [&_p]:text-sm",
        LINE_LOOK[look === "big" ? "grey" : look],
      )}
    >
      {look === "pill" || look === "tick" || look === "badge" ? (
        <CircleCheck
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      ) : look === "stacked" ? (
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-background">
          <Check aria-hidden className="size-4" />
        </span>
      ) : null}
      {children}
    </div>
  );
}

export function CountdownBlock({ look = "big" }: { look?: CountdownLook }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label={`Countdown · ${look}`} />;
  return <Countdown look={look} p={p} />;
}

function Countdown({ p, look }: { p: WalkIdeaParts; look: CountdownLook }) {
  const { countdown, now } = useWalkInfo(p);
  if (look === "pill")
    return (
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
          now.tone,
        )}
        suppressHydrationWarning
      >
        <Clock aria-hidden className="size-3.5" />
        {countdown.value} {countdown.unit}
      </span>
    );
  return (
    <div
      className={cn(
        "flex flex-col",
        look === "box" && cn("rounded-2xl p-5", now.tone),
      )}
      suppressHydrationWarning
    >
      <span className="text-5xl font-black tracking-tight sm:text-6xl">
        {countdown.value}
      </span>
      <span className="text-sm text-muted-foreground uppercase">
        {countdown.unit}
      </span>
    </div>
  );
}

/** The walk's status badge (Upcoming, Clock-in open, In progress…), with its line of words or without. */
export function StatusBadgeBlock({ withLine = true }: { withLine?: boolean }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Status badge" />;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge p={p} />
      {withLine ? <StatusLine p={p} withEyebrow={false} /> : null}
    </div>
  );
}

/** The day's timeline: clock-in opens, set off, finish, and how far along it is. */
export function TimelineBlock(o: TimelineOptions) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="The day's timeline" />;
  return <Timeline o={o} p={p} />;
}

/** The walk's name on its own. */
export function WalkNameBlock({
  size = "large",
}: {
  size?: "small" | "large" | "huge";
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Walk name" />;
  return (
    <h1
      className={cn(
        "leading-tight font-semibold tracking-tight text-balance",
        size === "small" && "text-xl",
        size === "large" && "text-2xl sm:text-3xl",
        size === "huge" && "text-4xl font-black sm:text-6xl",
      )}
    >
      {p.headline.title}
    </h1>
  );
}

// ── Back link ───────────────────────────────────────────────────────────
export type BackLook = "text" | "outline" | "ghost" | "solid" | "pill" | "icon";
export type BackArrow = "arrow" | "chevron" | "none";

/**
 * "← All walks" (organisers), "← Walks" (members) or "← Home" (visitors):
 * placed, worded and styled in the designer. A design with this block
 * doesn't get the fixed link above it.
 */
export function BackLinkBlock({
  look = "text",
  arrow = "arrow",
  label = "",
  align = "start",
}: {
  look?: BackLook;
  arrow?: BackArrow;
  label?: string;
  align?: "start" | "centre" | "end" | "full";
}) {
  const p = useWalkParts();
  const back = p?.back ?? { href: "/admin/walks", label: "All walks" };
  const words = label.trim() || back.label;
  const Icon = arrow === "chevron" ? ChevronLeft : ArrowLeft;
  const icon =
    arrow === "none" ? null : <Icon aria-hidden className="size-4" />;
  const link =
    look === "text" ? (
      <Link
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        href={back.href}
      >
        {icon}
        {words}
      </Link>
    ) : look === "icon" ? (
      <Button
        aria-label={words}
        asChild
        className="rounded-full"
        size="icon"
        variant="outline"
      >
        <Link href={back.href}>
          <Icon aria-hidden />
        </Link>
      </Button>
    ) : (
      <Button
        asChild
        className={cn(
          look === "pill" && "rounded-full",
          align === "full" && "w-full",
        )}
        size="sm"
        variant={
          look === "solid"
            ? "default"
            : look === "ghost"
              ? "ghost"
              : look === "pill"
                ? "secondary"
                : "outline"
        }
      >
        <Link href={back.href}>
          {icon}
          {words}
        </Link>
      </Button>
    );
  return (
    <div
      className={cn(
        "flex",
        align === "centre" && "justify-center",
        align === "end" && "justify-end",
      )}
    >
      {link}
    </div>
  );
}

// ── Precise location (what3words) ───────────────────────────────────────
export type PreciseLook = "card" | "compact" | "text";
export type PreciseAt =
  | "none"
  | "above-facts"
  | "below-facts"
  | "above-map"
  | "on-map"
  | "below-map"
  | "bottom";

/** The what3words precise location: the full card, a one-line chip, or a text link. */
export function PreciseLocation({
  address,
  look,
}: {
  address: string;
  look: PreciseLook;
}) {
  if (look === "card") return <What3wordsLink address={address} />;
  const words = (
    <span className="font-mono font-medium">
      <span className="text-[#e11f26]">{"///"}</span>
      {address}
    </span>
  );
  if (look === "text")
    return (
      <a
        className="flex w-fit items-center gap-1.5 text-sm underline-offset-4 hover:underline"
        href={what3wordsUrl(address)}
        rel="noopener noreferrer"
        target="_blank"
      >
        <MapPin aria-hidden className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">Precise location</span>
        {words}
      </a>
    );
  return (
    <a
      className="flex w-fit max-w-full items-center gap-2 rounded-full border bg-background/95 px-3 py-1.5 text-sm shadow-sm backdrop-blur-sm hover:bg-accent"
      href={what3wordsUrl(address)}
      rel="noopener noreferrer"
      target="_blank"
    >
      <MapPin aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{words}</span>
      <ArrowUpRight
        aria-hidden
        className="size-3.5 shrink-0 text-muted-foreground"
      />
    </a>
  );
}

/**
 * The walk's messages. In the designer, when the walk has none right now, a
 * sample stands in (marked as a preview) so the design's message spots can
 * be seen; real pages never show it.
 */
export function MessagesOrSample({
  p,
  editing,
  className,
}: {
  p: WalkIdeaParts;
  editing: boolean;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(false);
  const { opens } = useWalkInfo(p);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const check = () => setEmpty((el.textContent ?? "").trim() === "");
    check();
    const observer = new MutationObserver(check);
    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, []);
  return (
    // With no messages (and no sample), nothing shows — not even the
    // ribbon's coloured band. The CSS rule covers the first paint; the
    // check below also catches messages that leave only empty wrappers.
    <div
      className={cn(
        "flex flex-col gap-2 [&:has(>[data-messages]:empty):not(:has(>[data-sample]))]:hidden",
        className,
        empty && !editing && "hidden",
      )}
    >
      <div
        className="flex flex-col gap-2 empty:hidden"
        data-messages=""
        ref={box}
      >
        {p.notices}
      </div>
      {editing && empty ? (
        <Alert data-sample="" variant="info">
          <AlertDescription suppressHydrationWarning>
            Preview only: messages show here, e.g. Clock-in opens at{" "}
            {formatTime(opens)} on {formatWalkDay(opens)}.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

/**
 * Steps with a title and a few words each (How this group works), in the
 * same looks as Before you set off: ticks, numbered steps, a green callout,
 * numbered tiles, tiles in a swiping row, or one short paragraph.
 */
function StepsLooks({
  p,
  look,
  heading,
  steps,
}: {
  p: WalkIdeaParts;
  look: Exclude<BeforeLook, "card">;
  heading: string;
  steps: readonly { title: string; body: string }[];
}) {
  const { status } = useWalkInfo(p);
  if (status === "completed" || status === "cancelled") return null;
  if (look === "compact")
    return (
      <p className="text-sm text-muted-foreground">
        {heading ? (
          <span className="font-semibold text-foreground">{heading}: </span>
        ) : null}
        {steps.map((step) => step.title).join(" · ")}
      </p>
    );
  const number = (i: number) => String(i + 1).padStart(2, "0");
  const title = heading ? (
    <h2 className="text-base font-semibold">{heading}</h2>
  ) : null;
  // Equal boxes across the page: grey, or outlined; numbered cards.
  if (look === "grey-row" || look === "outline-row" || look === "number-cards")
    return (
      <section className="flex flex-col gap-3">
        {title}
        <ol className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
          {steps.map((step, i) => (
            <li
              className={cn(
                "flex flex-col gap-1 rounded-lg p-4 text-sm",
                look === "grey-row" ? "bg-muted" : "border",
              )}
              key={`${i}-${step.title}`}
            >
              {look === "number-cards" ? (
                <span className="mb-1 flex size-6 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                  {i + 1}
                </span>
              ) : null}
              <span className="font-medium">{step.title}</span>
              {step.body ? (
                <span className="text-muted-foreground">{step.body}</span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    );
  // One outlined box, a tick on each line, lines between.
  // One outlined box, a line between each step: a tick, or the step's
  // number in a small grey box.
  if (look === "boxed-ticks" || look === "boxed-numbers")
    return (
      <section className="flex flex-col gap-3">
        {title}
        <ul className="flex flex-col divide-y rounded-lg border text-sm" data-edge="">
          {steps.map((step, i) => (
            <li
              className="flex items-start gap-3 px-4 py-3"
              key={`${i}-${step.title}`}
            >
              {look === "boxed-numbers" ? (
                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold tabular-nums">
                  {i + 1}
                </span>
              ) : (
                <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
              )}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium">{step.title}</span>
                {step.body ? (
                  <span className="text-muted-foreground">{step.body}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  // Just the titles, as grey chips that wrap.
  if (look === "chips")
    return (
      <section className="flex flex-col gap-3">
        {title}
        <ul className="flex flex-wrap gap-2 text-sm">
          {steps.map((step, i) => (
            <li
              className="rounded-full bg-muted px-3 py-1"
              key={`${i}-${step.title}`}
            >
              {step.title}
            </li>
          ))}
        </ul>
      </section>
    );
  // Numbered steps across the page, one column each, joined by a line.
  if (look === "row")
    return (
      <section className="flex flex-col gap-4">
        {title}
        <ol className="grid gap-6 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
          {steps.map((step, i) => (
            <li
              className="relative flex flex-col gap-2 text-sm"
              key={`${i}-${step.title}`}
            >
              <span className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-foreground text-xs font-semibold">
                  {i + 1}
                </span>
                {i < steps.length - 1 ? (
                  <span
                    aria-hidden
                    className="h-px flex-1 bg-border max-sm:hidden"
                  />
                ) : null}
              </span>
              <span className="font-medium">{step.title}</span>
              {step.body ? (
                <span className="text-muted-foreground">{step.body}</span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    );
  // Big 01, 02, 03 in columns that fill the width.
  if (look === "big-numbers")
    return (
      <section className="flex flex-col gap-4">
        {title}
        <ol className="grid gap-6 sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
          {steps.map((step, i) => (
            <li
              className="flex flex-col gap-1 border-t pt-3 text-sm"
              key={`${i}-${step.title}`}
            >
              <span className="text-xl font-semibold tracking-tight text-muted-foreground/60 tabular-nums">
                {number(i)}
              </span>
              <span className="font-medium">{step.title}</span>
              {step.body ? (
                <span className="text-muted-foreground">{step.body}</span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    );
  // Full-width rows: number, title and words, a line between.
  if (look === "list" || look === "card-list")
    return (
      <section className="flex flex-col gap-3">
        {title}
        <ol
          className={cn(
            "flex flex-col divide-y text-sm",
            look === "card-list" && "overflow-hidden rounded-xl border bg-card",
          )}
          // In a full-width section: edge to edge, a line between each step
          // (the plain list's rows then get side space of their own).
          data-edge=""
          data-edge-rows={look === "list" ? "" : undefined}
        >
          {steps.map((step, i) => (
            <li
              className={cn(
                "flex items-start gap-3",
                look === "card-list" ? "p-3" : "py-3 first:pt-0 last:pb-0",
              )}
              key={`${i}-${step.title}`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 pt-1">
                <span className="font-medium">{step.title}</span>
                {step.body ? (
                  <span className="text-muted-foreground">{step.body}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </section>
    );
  // A line down the side, a numbered dot for each step.
  if (look === "timeline")
    return (
      <section className="flex flex-col gap-3">
        {title}
        <ol className="flex flex-col text-sm">
          {steps.map((step, i) => (
            <li className="flex gap-4" key={`${i}-${step.title}`}>
              <span className="flex flex-col items-center">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold">
                  {i + 1}
                </span>
                {i < steps.length - 1 ? (
                  <span aria-hidden className="w-px flex-1 bg-border" />
                ) : null}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 pb-5 pt-1">
                <span className="font-medium">{step.title}</span>
                {step.body ? (
                  <span className="text-muted-foreground">{step.body}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </section>
    );
  // Two even columns of numbered steps.
  if (look === "two-columns")
    return (
      <section className="flex flex-col gap-3">
        {title}
        <ol className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
          {steps.map((step, i) => (
            <li className="flex items-start gap-3" key={`${i}-${step.title}`}>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium">{step.title}</span>
                {step.body ? (
                  <span className="text-muted-foreground">{step.body}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </section>
    );
  if (look === "tiles" || look === "swipe")
    return (
      <section className="flex flex-col gap-3">
        {heading ? (
          <h2 className="text-base font-semibold">{heading}</h2>
        ) : null}
        <ol
          className={cn(
            "grid gap-2 sm:grid-cols-2 lg:grid-cols-4",
            look === "swipe" && cn(SWIPE, "gap-3 [&>*]:w-64"),
          )}
        >
          {steps.map((step, i) => (
            <li
              className="flex flex-col gap-2 rounded-xl bg-muted/60 p-4 text-sm"
              key={`${i}-${step.title}`}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-background text-xs font-semibold">
                {i + 1}
              </span>
              <span className="font-medium">{step.title}</span>
              <span className="text-muted-foreground">{step.body}</span>
            </li>
          ))}
        </ol>
      </section>
    );
  return (
    <section
      className={cn(
        "flex flex-col gap-3",
        look === "callout" &&
          "rounded-lg border-l-4 border-foreground/20 bg-muted/60 p-5",
      )}
    >
      {heading ? <h2 className="text-base font-semibold">{heading}</h2> : null}
      <ol className="flex flex-col gap-3 text-sm">
        {steps.map((step, i) => (
          <li className="flex items-start gap-2.5" key={`${i}-${step.title}`}>
            {look === "numbered" ? (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                {i + 1}
              </span>
            ) : (
              <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
            )}
            <span>
              <span className="font-medium">{step.title}</span>
              {step.body ? (
                <span className="block opacity-80">{step.body}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ── Every fact, in other designs' looks (the Details card's Facts shown as) ─
export type FactsLook =
  | "card-table"
  | "colour-blocks"
  | "story-cards"
  | "summary"
  | "stat-cards"
  | "icon-circles"
  | "sticky-notes"
  | "spec-sheet"
  | "journey"
  | "top-bar"
  | "columns"
  | "big-pills"
  | "mini-cards"
  | "wide-tiles";

const PASTELS = [
  "bg-amber-100 text-amber-950",
  "bg-emerald-100 text-emerald-950",
  "bg-sky-100 text-sky-950",
  "bg-rose-100 text-rose-950",
  "bg-violet-100 text-violet-950",
  "bg-lime-100 text-lime-950",
];
// One colour per fact (there are up to 12), so none repeat.
const TOP_BARS = [
  "border-t-emerald-500",
  "border-t-sky-500",
  "border-t-amber-500",
  "border-t-rose-500",
  "border-t-violet-500",
  "border-t-orange-500",
  "border-t-teal-500",
  "border-t-pink-500",
  "border-t-indigo-500",
  "border-t-lime-500",
  "border-t-cyan-500",
  "border-t-fuchsia-500",
  "border-t-red-500",
  "border-t-yellow-500",
];
const BOLDS = [
  "bg-amber-300 text-amber-950",
  "bg-sky-300 text-sky-950",
  "bg-rose-300 text-rose-950",
  "bg-violet-300 text-violet-950",
  "bg-emerald-300 text-emerald-950",
  "bg-orange-300 text-orange-950",
];

/**
 * Every filled-in fact from Edit walk (or Not set, for organisers, when
 * asked) in one of several looks, so the Details card can show the facts
 * however a design wants without leaving any out. 24px between them, like
 * the rest of the page.
 */
export function FactLooks(props: {
  p: WalkIdeaParts;
  look: FactsLook;
  arrange?: Arrange;
  showEmpty?: boolean;
  /** Looks with a frame round them all (Spec sheet): show it or not. */
  border?: boolean;
}) {
  const arrange = keptArrange(props.look, props.arrange);
  return (
    <MaybeRow arrange={arrange}>
      <FactLooksBody {...props} arrange={arrange} />
    </MaybeRow>
  );
}

function FactLooksBody({
  p,
  look,
  arrange = "fill",
  showEmpty = false,
  border = true,
}: {
  p: WalkIdeaParts;
  look: FactsLook;
  arrange?: Arrange;
  showEmpty?: boolean;
  border?: boolean;
}) {
  const { facts } = useWalkInfo(p, showEmpty);
  const flow = (basis: string, width: string, grid: string) =>
    arrange === "scroll"
      ? cn(SWIPE, "gap-[var(--facts-gap,1.5rem)]", width)
      : arrange === "grid"
        ? cn("grid gap-[var(--facts-gap,1.5rem)]", grid)
        : cn(STRETCH, "gap-[var(--facts-gap,1.5rem)]", basis);

  if (look === "wide-tiles")
    return (
      <div
        className={flow(
          "[&>*]:basis-72",
          "[&>*]:w-80",
          "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {facts.map((fact, i) => (
          <div
            className="flex min-w-0 items-center gap-4 rounded-lg border bg-card p-4"
            data-wide={fact.wide ? "" : undefined}
            key={fact.label}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                PASTELS[i % PASTELS.length],
              )}
            >
              <fact.icon aria-hidden className="size-5" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">
                {fact.label}
              </span>
              <span
                className="leading-snug font-semibold text-pretty [overflow-wrap:anywhere]"
                suppressHydrationWarning
              >
                {fact.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    );

  if (look === "columns")
    return (
      <dl className="flex flex-wrap gap-y-6 divide-x">
        {facts.map((fact) => (
          <div
            className="flex min-w-0 flex-col px-6 first:pl-0"
            data-wide={fact.wide ? "" : undefined}
            key={fact.label}
          >
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="font-semibold" suppressHydrationWarning>
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    );

  if (look === "big-pills")
    return (
      <ul
        className={cn(
          "flex flex-wrap gap-[var(--facts-gap,1.5rem)]",
          arrange === "scroll" && cn(SWIPE, "whitespace-nowrap"),
        )}
      >
        {facts.map((fact) => (
          <li
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
            data-wide={fact.wide ? "" : undefined}
            key={fact.label}
          >
            <fact.icon aria-hidden className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">{fact.label}</span>
            <span className="font-semibold" suppressHydrationWarning>
              {fact.value}
            </span>
          </li>
        ))}
      </ul>
    );

  // The same card list as the Walks, Members and History pages: one
  // outlined box, a row per fact. On a phone the label sits over the value;
  // wider, the value moves to the right of its row.
  if (look === "card-table")
    return (
      <DataList className={cn(!border && "rounded-none border-0")}>
        {facts.map((fact) => (
          <DataListItem
            className="items-start gap-3 hover:bg-transparent sm:items-center"
            key={fact.label}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <fact.icon aria-hidden className="size-4 text-muted-foreground" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <span className="text-xs text-muted-foreground sm:text-sm">
                {fact.label}
              </span>
              <span
                className="text-sm font-medium [overflow-wrap:anywhere] sm:text-right"
                suppressHydrationWarning
              >
                {fact.value}
              </span>
            </span>
          </DataListItem>
        ))}
      </DataList>
    );

  if (look === "spec-sheet")
    return (
      <dl
        className={cn("overflow-hidden rounded-xl text-sm", border && "border")}
        data-edge=""
      >
        {facts.map((fact, i) => (
          // On a phone the label sits over its value, so a long value (a
          // meeting point, a what3words) gets the whole width instead of
          // wrapping in a narrow column; wider, they share a row.
          <div
            className={cn(
              "flex flex-col gap-0.5 px-4 py-3 sm:grid sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6",
              i % 2 === 1 && "bg-muted/50",
            )}
            data-wide={fact.wide ? "" : undefined}
            key={fact.label}
          >
            <dt className="text-xs font-medium text-muted-foreground sm:text-sm sm:font-semibold sm:text-foreground">
              {fact.label}
            </dt>
            {/* Wider, the value sits on the far right of its row. */}
            <dd
              className="font-medium [overflow-wrap:anywhere] sm:text-right sm:font-normal"
              suppressHydrationWarning
            >
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    );

  if (look === "journey")
    return (
      <ol className="flex snap-x overflow-x-auto pb-1 [scrollbar-width:none]">
        {facts.map((fact, i) => (
          <li
            className="flex w-44 shrink-0 snap-start flex-col gap-2"
            data-wide={fact.wide ? "" : undefined}
            key={fact.label}
          >
            <span className="flex items-center">
              <span className="size-3 shrink-0 rounded-full bg-emerald-600" />
              {i < facts.length - 1 ? (
                <span aria-hidden className="h-0.5 flex-1 bg-emerald-600/30" />
              ) : null}
            </span>
            <span className="pr-6 text-xs text-muted-foreground">
              {fact.label}
            </span>
            <span
              className="pr-6 text-sm font-semibold [overflow-wrap:anywhere]"
              suppressHydrationWarning
            >
              {fact.value}
            </span>
          </li>
        ))}
      </ol>
    );

  if (look === "icon-circles")
    return (
      <div
        className={flow(
          "[&>*]:basis-56",
          "[&>*]:w-56",
          "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {facts.map((fact, i) => (
          <div className="flex min-w-0 items-center gap-3" key={fact.label}>
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full",
                PASTELS[i % PASTELS.length],
              )}
            >
              <fact.icon aria-hidden className="size-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-xs text-muted-foreground">
                {fact.label}
              </span>
              <span className="truncate font-semibold" suppressHydrationWarning>
                {fact.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    );

  if (look === "sticky-notes")
    return (
      <div
        className={flow(
          "[&>*]:basis-40",
          "[&>*]:w-44",
          "grid-cols-2 sm:grid-cols-4",
        )}
      >
        {facts.map((fact, i) => (
          <div
            className={cn(
              "flex min-w-0 flex-col gap-1 p-4 shadow-sm",
              PASTELS[i % PASTELS.length],
              i % 2 === 0 ? "-rotate-1" : "rotate-1",
            )}
            data-wide={fact.wide ? "" : undefined}
            key={fact.label}
          >
            <span className="text-xs font-semibold uppercase opacity-70">
              {fact.label}
            </span>
            <span
              className="font-semibold [overflow-wrap:anywhere]"
              suppressHydrationWarning
            >
              {fact.value}
            </span>
          </div>
        ))}
      </div>
    );

  // Cards with a value each: colour blocks, story cards, summary tiles, stat cards.
  const plain =
    look === "summary" ||
    look === "stat-cards" ||
    look === "top-bar" ||
    look === "mini-cards";
  const tone = (i: number) =>
    look === "colour-blocks"
      ? BOLDS[i % BOLDS.length]
      : look === "story-cards"
        ? PASTELS[i % PASTELS.length]
        : look === "stat-cards"
          ? "border bg-card shadow-sm"
          : look === "top-bar"
            ? cn("border border-t-4", TOP_BARS[i % TOP_BARS.length])
            : look === "mini-cards"
              ? "rounded-lg bg-muted/60 p-3"
              : "border";
  return (
    <div
      className={flow(
        "[&>*]:basis-40",
        "[&>*]:w-44 sm:[&>*]:w-52",
        "grid-cols-2 sm:grid-cols-4",
      )}
    >
      {facts.map((fact, i) => (
        <div
          className={cn(
            "flex min-w-0 flex-col gap-1 rounded-2xl p-4",
            !plain && "justify-between gap-6",
            tone(i),
            fact.wide && arrange === "grid" && "sm:col-span-2",
          )}
          data-wide={fact.wide ? "" : undefined}
          key={fact.label}
        >
          {plain ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <fact.icon aria-hidden className="size-3.5" />
              {fact.label}
            </span>
          ) : (
            <fact.icon aria-hidden className="size-5" />
          )}
          <span className="flex min-w-0 flex-col">
            {plain ? null : (
              <span className="text-xs font-semibold uppercase opacity-70">
                {fact.label}
              </span>
            )}
            <span
              className={cn(
                "leading-snug font-semibold text-pretty [overflow-wrap:anywhere]",
                look === "stat-cards" ? "text-2xl" : "text-base",
              )}
              suppressHydrationWarning
            >
              {fact.value}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
