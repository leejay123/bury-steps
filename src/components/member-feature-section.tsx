import Link from "next/link";
import { Bell, ChevronRight, Footprints, History, LineChart, Mail } from "lucide-react";
import type React from "react";
import { DecorIcon } from "@/components/decor-icon";
import { cn } from "@/lib/utils";

type BentoTile = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  /** Wider tile for the primary action — everything else stays a single cell. */
  wide?: boolean;
};

const BASE_TILES: BentoTile[] = [
  {
    title: "See what's on",
    description: "Upcoming walks, meeting points, and a one-tap clock-in on the day.",
    icon: <Footprints />,
    href: "/walks",
    wide: true,
  },
  {
    title: "Track your progress",
    description: "Your monthly goal and how many walks you've done.",
    icon: <LineChart />,
    href: "/progress",
  },
  {
    title: "Catch up on notices",
    description: "Anything organisers have posted for the group.",
    icon: <Bell />,
    href: "/notices",
  },
  {
    title: "Your walk history",
    description: "Every walk you've clocked into, past and present.",
    icon: <History />,
    href: "/history",
  },
  {
    title: "Get in touch",
    description: "Questions for the organisers — we'll get back to you.",
    icon: <Mail />,
    href: "/contact",
  },
];

/**
 * Same "connected" seamless-grid look as FeatureSection (hairline dividers
 * via gap-px + bg-border, not gapped/shadowed cards) — shown to signed-in
 * members instead of the "how this group works" explainer, which stops
 * being useful once you've already joined.
 */
export function MemberFeatureSection({ progressEnabled = true }: { progressEnabled?: boolean }) {
  const tiles = progressEnabled ? BASE_TILES : BASE_TILES.filter((tile) => tile.href !== "/progress");
  // The grid is 3 columns, a wide tile spans 2 — with all 5 tiles that's
  // 6 column-tracks (2+1+1+1+1), filling two full rows exactly. Dropping
  // "Track your progress" leaves 5 tracks (2+1+1+1), one short of a full
  // row: without this, the last row would end with one cell that's just
  // the grid's own bg-border colour showing through — a "missing tile"
  // grey box. Making the last tile wide too brings it back to 6.
  if (!progressEnabled && tiles.length > 0) {
    tiles[tiles.length - 1] = { ...tiles[tiles.length - 1], wide: true };
  }
  return (
    <div className="relative w-full">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <div className="grid w-full grid-cols-1 gap-px bg-border sm:grid-cols-3">
        {tiles.map((tile) => (
          <BentoCard className={cn("h-full", tile.wide && "sm:col-span-2")} key={tile.title} tile={tile} />
        ))}
      </div>
    </div>
  );
}

function BentoCard({ tile, className, ...props }: React.ComponentProps<"div"> & { tile: BentoTile }) {
  return (
    <div className={cn("relative bg-background", className)} {...props}>
      <Link
        className="group flex h-full flex-col justify-between gap-6 p-6 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:p-8"
        href={tile.href}
      >
        <div className="flex items-center justify-between">
          <div className="[&_svg]:size-5 [&_svg]:text-primary">{tile.icon}</div>
          <ChevronRight
            aria-hidden="true"
            className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">{tile.title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{tile.description}</p>
        </div>
      </Link>
    </div>
  );
}
