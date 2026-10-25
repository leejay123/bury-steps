import type { ReactNode } from "react";
import { ArrowLeft, ChevronLeft } from "lucide-react";
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
  const content = (design as { content?: Item[] } | null)?.content ?? [];
  return (
    <div aria-hidden className="flex flex-col gap-6">
      {content.map((item, i) => (
        <BlockSkeleton backLabel={backLabel} item={item} key={i} />
      ))}
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
        "w-full rounded-lg",
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
    description: (
      <div className="flex flex-col gap-1">
        <SkLine className="w-full" />
        <SkLine className="w-5/6" />
        <SkLine className="w-2/3" />
      </div>
    ),
    essentials: (
      <div className="flex flex-wrap gap-2">
        {[24, 28, 32].map((w) => (
          <Skeleton
            className="h-8 rounded-full"
            key={w}
            style={{ width: `${w * 4}px` }}
          />
        ))}
      </div>
    ),
    precise: <Skeleton className="h-16 w-full rounded-lg" />,
    map,
    // Only once clocked in: nothing to hold a place for.
    clockin: null,
    countdown: <SkLine className="w-28" size="sm" />,
  };
  const band = String(p.titleLook ?? "").startsWith("band");
  const name = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-8 w-2/3 max-w-md rounded-lg" />
        <SkLine className="w-56" size="sm" />
      </div>
      {/* The Manage (and Clock in) button. */}
      {p.showActions !== false ? (
        <Skeleton className="h-9 w-28 rounded-lg" />
      ) : null}
    </div>
  );
  const insideParts = inside.map((part) => <div key={part}>{parts[part]}</div>);
  const title = !showTitle ? null : band ? (
    <section className="flex flex-col overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-4 bg-muted px-4 py-2.5 sm:px-5">
        <SkLine className="w-64 bg-background" size="sm" />
        <SkLine className="w-40 bg-background max-sm:hidden" size="sm" />
      </div>
      <div className="flex flex-col gap-6 p-4 sm:p-5">
        {name}
        {insideParts}
      </div>
    </section>
  ) : (
    <div className="flex flex-col gap-6">
      {name}
      {insideParts}
    </div>
  );
  const outside = (part: TitlePart) => !inside.includes(part);
  const precise =
    p.preciseAt && p.preciseAt !== "none" && outside("precise")
      ? parts.precise
      : null;
  return (
    <div className="flex flex-col gap-6">
      {p.map === "top" && outside("map") ? map : null}
      {title}
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
