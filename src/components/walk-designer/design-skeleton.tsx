import type { ReactNode } from "react";
import { ArrowLeft, ChevronLeft, Plus } from "lucide-react";
import { SkLine } from "@/components/list-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { keptFactsAs, titlePartsOf, type TitlePart } from "./design-rules";

/**
 * The loading placeholder for a designed walk page: it follows the saved
 * design block by block (the Details card's title box and what's inside it,
 * the facts, map and the real tab names), so the page doesn't swap from the
 * standard tabbed shape to the design when it loads. Grey shapes where the
 * walk's own words and buttons go — never empty space.
 */
type Item = { type?: string; props?: Record<string, unknown> };

export function DesignSkeleton({
  design,
  backLabel = "All walks",
}: {
  design: unknown;
  /** The Back link's words when the block has none of its own (as on that page). */
  backLabel?: string;
}) {
  const data = design as { content?: Item[]; root?: { props?: { join?: string } } } | null;
  const content = data?.content ?? [];
  // The same frame as the page (config.tsx, PageRoot and BlockFrame): joined
  // into the page card ("join", or missing) or each block its own box
  // ("inset"), so the dashboard draws the same lines and space around it.
  const join = data?.root?.props?.join !== "inset";
  return (
    <div
      aria-hidden
      className={cn("flex flex-col", join ? "gap-0" : "gap-6")}
      data-edge-inset={join ? undefined : ""}
      data-edge-join={join ? "" : undefined}
    >
      <div hidden />
      <div className={cn("flex flex-col", join ? "gap-0" : "gap-6")}>
        {content.map((item, i) => {
          const block = <BlockSkeleton backLabel={backLabel} item={item} />;
          return block === null ? null : (
            <div className="flex flex-col has-[>div:empty]:hidden" key={i}>
              <div className="flex min-w-0 flex-1 flex-col gap-3">{block}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlockSkeleton({
  item,
  backLabel,
}: {
  item: Item;
  backLabel: string;
}) {
  const p = item.props ?? {};
  switch (item.type) {
    case "BackLink": {
      // The same arrow and look as the real Back link block, so nothing
      // swaps when the page arrives.
      const words = String(p.label || backLabel);
      const Icon = p.arrow === "chevron" ? ChevronLeft : ArrowLeft;
      if ((p.look ?? "text") === "text")
        return (
          <span className="flex w-fit items-center gap-1 text-sm text-muted-foreground">
            {p.arrow === "none" ? null : (
              <Icon aria-hidden className="size-4" />
            )}
            {words}
          </span>
        );
      return p.look === "icon" ? (
        <Skeleton className="size-9 rounded-full" />
      ) : (
        <Skeleton
          className={cn(
            "h-8 w-32",
            p.look === "pill" ? "rounded-full" : "rounded-lg",
          )}
        />
      );
    }
    case "Details":
      return <DetailsSkeleton p={p} />;
    case "Tabs":
      return <TabsSkeleton p={p} />;
    case "Messages":
      // Only shown when there are messages: nothing to hold a place for.
      return null;
    case "Accordion":
    case "Folding":
      return <FoldingSkeleton p={p} />;
    default:
      return (
        <div className="flex flex-col gap-2">
          <SkLine className="w-2/3" />
          <SkLine className="w-1/2" />
        </div>
      );
  }
}

/** The facts as tiles (cards and tiles looks) or rows (lists and tables). */
const ROW_LOOKS = [
  "list",
  "table",
  "spec-sheet",
  "spec-lines",
  "spec-columns",
  "spec-compact",
  "spec-left",
  "spec-stacked",
  "spec-grey",
  "card-table",
  "columns",
];

function FactsSkeleton({ look }: { look: string }) {
  if (ROW_LOOKS.includes(look))
    return (
      <div className="flex flex-col divide-y rounded-lg border">
        {[0, 1, 2, 3].map((i) => (
          <div
            className="flex items-center justify-between gap-6 px-4 py-3"
            key={i}
          >
            <SkLine className="w-24" size="sm" />
            <SkLine className="w-28" size="sm" />
          </div>
        ))}
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div className="flex flex-col gap-2 rounded-lg border p-4" key={i}>
          <SkLine className="w-16" size="sm" />
          <SkLine className="w-24" />
        </div>
      ))}
    </div>
  );
}

function DetailsSkeleton({ p }: { p: Record<string, unknown> }) {
  const factsAs = keptFactsAs(p.factsAs);
  const phoneAs = keptFactsAs(p.phoneFactsAs ?? "same");
  const computerLook =
    factsAs === "facts" ? String(p.facts ?? "grid") : factsAs;
  const phoneLook =
    phoneAs !== "same"
      ? phoneAs === "facts"
        ? String(p.phoneFacts ?? p.facts ?? "grid")
        : phoneAs
      : factsAs === "facts" && p.phoneFacts && p.phoneFacts !== "same"
        ? String(p.phoneFacts)
        : computerLook;
  const facts =
    factsAs === "none" && (phoneAs === "same" || phoneAs === "none") ? null : (
      <>
        <div className="md:hidden">
          <FactsSkeleton look={phoneLook} />
        </div>
        <div className="max-md:hidden">
          <FactsSkeleton look={computerLook} />
        </div>
      </>
    );
  const showTitle = p.showTitle !== false && factsAs !== "bento";
  const inside = showTitle ? titlePartsOf(p) : [];
  const map = (
    <Skeleton
      className={cn(
        "w-full rounded-2xl",
        p.mapHeight === "short"
          ? "h-44"
          : p.mapHeight === "tall"
            ? "h-96"
            : "h-64",
      )}
    />
  );
  const parts: Record<TitlePart, ReactNode> = {
    createdby: <SkLine className="w-48" size="sm" />,
    facts,
    timeline: (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex justify-between">
          <SkLine className="w-24" size="sm" />
          <SkLine className="w-16" size="sm" />
          <SkLine className="w-16" size="sm" />
        </div>
      </div>
    ),
    // The real headings (blocks.tsx: text-base, semibold), then the walk's words and chips.
    description: (
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Description</h2>
        <SkLine className="w-2/3" />
      </div>
    ),
    essentials: (
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Essentials</h2>
        <div className="flex flex-wrap gap-2">
          {[24, 28, 32].map((w) => (
            <Skeleton
              className="h-7.5 rounded-full"
              key={w}
              style={{ width: `${w * 4}px` }}
            />
          ))}
        </div>
      </div>
    ),
    precise: <Skeleton className="h-9.5 w-full rounded-lg" />,
    map,
    // Only once clocked in: nothing to hold a place for.
    clockin: null,
    // Clocked in / attended: like Your clock-in, only shown once known.
    people: null,
    countdown: <SkLine className="w-28" size="sm" />,
  };
  const band = String(p.titleLook ?? "").startsWith("band");
  const name = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-8 w-2/3 max-w-md rounded-lg" />
        {/* Created by, when it's tucked under the name (otherwise it's a part below). */}
        {p.titleExtrasAt === "under-name" && inside.includes("createdby") ? <SkLine className="w-56" size="sm" /> : null}
      </div>
      {/* The Manage (and Clock in) button. */}
      {p.showActions !== false ? (
        <Skeleton className="h-9 w-28 rounded-lg" />
      ) : null}
    </div>
  );
  // The title's own gaps and each part's Space above it, as the real card
  // (blocks.tsx: titleGap, titleParts[].space), so nothing moves on arrival.
  const SPACE: Record<string, number> = { none: 0, "8": 8, "12": 12, "16": 16, "24": 24, "32": 32, "40": 40, "56": 56 };
  const stackGap = ({ closer: 12, normal: 24, more: 32 } as Record<string, number>)[String(p.titleGap ?? "normal")] ?? 24;
  const titleParts = Array.isArray(p.titleParts) ? (p.titleParts as { part?: string; space?: string }[]) : [];
  const spaceOf = (part: string) => {
    const chosen = titleParts.find((item) => item?.part === part)?.space;
    return chosen && chosen in SPACE ? SPACE[chosen]! : stackGap;
  };
  // Created by, Your clock-in and the Countdown tucked under the name (its grey line).
  const tucked = (part: string) =>
    p.titleExtrasAt === "under-name" && (part === "clockin" || part === "countdown" || part === "createdby");
  const insideParts = inside
    .filter((part) => !tucked(part) && parts[part] !== null)
    .map((part) => (
      <div key={part} style={{ marginTop: spaceOf(part) - stackGap }}>
        {parts[part]}
      </div>
    ));
  const title = !showTitle ? null : band ? (
    <section className="flex flex-col overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between gap-4 border-b px-5 py-2.5">
        <SkLine className="w-64" size="sm" />
        <SkLine className="w-40 max-sm:hidden" size="sm" />
      </div>
      <div className="flex flex-col p-4 sm:p-5" style={{ gap: stackGap }}>
        {name}
        {insideParts}
      </div>
    </section>
  ) : (
    <div className="flex flex-col" style={{ gap: stackGap }}>
      {name}
      {insideParts}
    </div>
  );
  const outside = (part: TitlePart) => !inside.includes(part);
  const precise =
    p.preciseAt && p.preciseAt !== "none" && outside("precise")
      ? parts.precise
      : null;
  // Wrapped as the real card is (blocks.tsx), so the joined page's rules
  // (shadcnio.css) take the same box off it.
  return (
    <section className="flex flex-col gap-6 overflow-clip">
      {p.map === "top" && outside("map") ? map : null}
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-6">{title}</div>
      </div>
      {p.timeline && outside("timeline") ? parts.timeline : null}
      {outside("facts") ? facts : null}
      {precise}
      {p.showEssentials !== false && outside("essentials")
        ? parts.essentials
        : null}
      {p.showDescription !== false && outside("description")
        ? parts.description
        : null}
      {(p.map === "bottom" || p.map === "side") && outside("map") ? map : null}
    </section>
  );
}

/** Folding sections (Accordion and Folding blocks): their real names, closed, in the same boxes. */
function FoldingSkeleton({ p }: { p: Record<string, unknown> }) {
  const items = Array.isArray(p.items)
    ? (p.items as { label?: string; showTo?: string }[]).filter((item) => item.showTo !== "visitors")
    : [];
  return (
    <div className="flex flex-col gap-3" data-slot="accordion">
      {items.map((item, i) => (
        <div className="rounded-lg border" data-slot="accordion-item" key={i}>
          <div className="flex items-center justify-between gap-4 p-4">
            <span className="text-sm font-medium">{item.label || "Section"}</span>
            <Plus aria-hidden className="size-4 text-muted-foreground" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TabsSkeleton({ p }: { p: Record<string, unknown> }) {
  const tabs = Array.isArray(p.tabs)
    ? (p.tabs as { label?: string }[])
        .map((t) => String(t.label ?? ""))
        .filter(Boolean)
    : [];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 overflow-hidden">
        {tabs.map((label, i) => (
          <span
            className={cn(
              "flex h-9 flex-1 items-center justify-center rounded-lg border px-4 text-sm font-medium whitespace-nowrap",
              i === 0 ? "border-foreground" : "text-muted-foreground",
            )}
            key={label}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <SkLine className="w-2/3" />
        <SkLine className="w-1/2" />
        <SkLine className="w-3/5" />
      </div>
    </div>
  );
}
