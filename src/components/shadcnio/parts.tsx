import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * The pieces shadcn.io's homepage is built from, with their exact classes
 * (used with their permission): buttons, section heads, the + guide lines
 * between sections, and the "sketch" tiles with their rings.
 */

const BUTTON_BASE =
  "cn-button group/button relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap outline-none transition-transform disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-disabled:pointer-events-none data-disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[state=loading]:pointer-events-none active:not-aria-[haspopup]:scale-[0.98] cn-button-size-lg rounded-[calc(var(--radius)*100)] h-11 px-6 font-medium text-[15px]";
export const BUTTON_PRIMARY = `${BUTTON_BASE} cn-button-variant-default`;
export const BUTTON_OUTLINE = `${BUTTON_BASE} cn-button-variant-outline bg-background hover:bg-muted`;

export function PillLink({
  href,
  children,
  variant = "primary",
  arrow = false,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline";
  arrow?: boolean;
  className?: string;
}) {
  const external = href.startsWith("http");
  const classes = cn(variant === "primary" ? BUTTON_PRIMARY : BUTTON_OUTLINE, arrow && "gap-2", className);
  const body = (
    <>
      {children}
      {arrow ? <ArrowRight aria-hidden className="size-4 rtl:rotate-180" /> : null}
    </>
  );
  return external ? (
    <a className={classes} href={href} rel="noopener noreferrer" target="_blank">
      {body}
    </a>
  ) : (
    <Link className={classes} href={href}>
      {body}
    </Link>
  );
}

/** The line across the window between two sections, with a + where it meets the column. */
export function Guides() {
  const mark = (side: "start" | "end") => (
    <svg
      aria-hidden="true"
      className={cn(
        "absolute size-3.5 text-muted-foreground top-0 -translate-y-[calc(50%+0.5px)]",
        side === "start"
          ? "start-0 -translate-x-[calc(50%+0.5px)] rtl:translate-x-[calc(50%+0.5px)]"
          : "end-0 translate-x-[calc(50%+0.5px)] rtl:-translate-x-[calc(50%+0.5px)]",
      )}
      data-slot="guides-mark"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      viewBox="0 0 14 14"
    >
      <path d="M7 0v14M0 7h14" />
    </svg>
  );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 border-0 [--guides-inset:1rem] sm:[--guides-inset:2rem] only:hidden"
      data-slot="guides"
    >
      <div className="absolute -top-px h-px border-t -inset-x-[100vw]" data-slot="guides-line" />
      {mark("start")}
      {mark("end")}
    </div>
  );
}

/** A section after the first: its guide line on top. */
export function Section({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <Guides />
      <section aria-labelledby={id} className={cn("border-t first-of-type:border-t-0", className)}>
        {children}
      </section>
    </div>
  );
}

/** Title, intro (its first words in full colour) and the pill button on the right. */
export function SectionHead({
  id,
  title,
  lead,
  rest,
  action,
}: {
  id: string;
  title: ReactNode;
  lead: ReactNode;
  rest: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="px-5 md:px-12 flex flex-col gap-5 pt-12 pb-8 md:flex-row md:items-end md:justify-between md:gap-8 md:pt-16 md:pb-10">
      <div className="flex flex-col max-w-2xl gap-3 lg:gap-4">
        <h2 className="text-balance font-semibold text-3xl tracking-tighter md:text-4xl" id={id}>
          {title}
        </h2>
        <p className="text-pretty text-muted-foreground md:text-lg">
          <span className="font-medium text-foreground">{lead}</span> {rest}
        </p>
      </div>
      {action ? (
        <div className="flex shrink-0 gap-2">
          <PillLink arrow href={action.href}>
            {action.label}
          </PillLink>
        </div>
      ) : null}
    </div>
  );
}

export const GRID = "grid border-t [clip-path:inset(1px_0_0_1px)] *:border-t *:border-l grid-cols-2 lg:grid-cols-4";

const TILE =
  "group flex flex-col outline-none hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset relative h-40 overflow-hidden";
const RING =
  "absolute border transition-[scale,border-color] motion-safe:group-focus-visible:scale-[1.03] motion-safe:group-hover:scale-[1.03] duration-300 ease-out motion-reduce:transition-none";
const RING_TONES = [
  "border-foreground/[0.07] group-hover:border-foreground/[0.11] group-focus-visible:border-foreground/[0.11]",
  "border-foreground/[0.1] group-hover:border-foreground/[0.15] group-focus-visible:border-foreground/[0.15]",
  "border-foreground/[0.13] group-hover:border-foreground/[0.19] group-focus-visible:border-foreground/[0.19]",
];
/** The three rings behind a tile's picture, in the shape of what they frame. */
const RING_SHAPES = {
  card: {
    vars: "[--ring-clear:18rem] [--ring-solid:12rem] [--ring-x:4.5rem] [--ring-y:1.75rem]",
    rings: [
      "-end-24 -bottom-26 h-66 w-84 rounded-[5.5rem]",
      "-end-18 -bottom-20 h-54 w-72 rounded-[4rem]",
      "-end-12 -bottom-14 h-42 w-60 rounded-[2.5rem]",
    ],
  },
  square: {
    vars: "[--ring-x:2.25rem] [--ring-y:1.75rem]",
    rings: [
      "-end-23 -bottom-25 size-64 rounded-[6.25rem]",
      "-end-17 -bottom-19 size-52 rounded-[4.75rem]",
      "-end-11 -bottom-13 size-40 rounded-[3.25rem]",
    ],
  },
  circle: {
    vars: "[--ring-x:2.5rem] [--ring-y:2.5rem]",
    rings: ["-end-22 -bottom-22 size-64 rounded-full", "-end-16 -bottom-16 size-52 rounded-full", "-end-10 -bottom-10 size-40 rounded-full"],
  },
  stack: {
    vars: "[--ring-x:5.75rem] [--ring-y:1.25rem]",
    rings: [
      "-end-11 -bottom-29 size-68 rounded-[7.375rem]",
      "-end-5 -bottom-23 size-56 rounded-[5.875rem]",
      "end-1 -bottom-17 size-44 rounded-[4.375rem]",
    ],
  },
} as const;

function Rings({ shape }: { shape: keyof typeof RING_SHAPES }) {
  const { vars, rings } = RING_SHAPES[shape];
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_top,#000_50%,transparent_72%)]", vars)}
    >
      <span className="absolute inset-0 [mask-image:radial-gradient(circle_at_calc(100%-var(--ring-x))_calc(100%-var(--ring-y)),#000_var(--ring-solid,5rem),transparent_var(--ring-clear,11rem))]">
        {rings.map((ring, i) => (
          <span className={cn(RING, RING_TONES[i], ring)} key={ring} />
        ))}
      </span>
    </span>
  );
}

const PANEL =
  "border border-foreground/[0.1] bg-background bg-linear-to-b from-transparent to-foreground/[0.03] dark:from-foreground/[0.06] dark:to-foreground/[0.01] shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_14px_-2px_rgb(0_0_0/0.08)] dark:shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_9%,transparent),0_4px_14px_-2px_rgb(0_0_0/0.6)] group-hover:border-foreground/[0.2] group-focus-visible:border-foreground/[0.2] duration-300 ease-out motion-reduce:transition-none";
const FAN_CARD = `pointer-events-none absolute -end-6 -bottom-8 h-30 w-48 origin-bottom-right overflow-hidden rounded-[1rem] ${PANEL} after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] dark:after:shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_9%,transparent)] transition-[translate,rotate,border-color] group-hover/card:border-foreground/[0.2]`;
const FAN_POSES = [
  "-translate-x-[6.5rem] translate-y-2 -rotate-[8deg] rtl:translate-x-[6.5rem] rtl:rotate-[8deg] group-hover:-translate-x-[7.25rem] group-hover:-rotate-[10deg] group-focus-visible:-translate-x-[7.25rem] group-focus-visible:-rotate-[10deg]",
  "-translate-x-[3.25rem] translate-y-1 -rotate-[4deg] rtl:translate-x-[3.25rem] rtl:rotate-[4deg] group-hover:-translate-x-[3.75rem] group-hover:-rotate-[5deg] group-focus-visible:-translate-x-[3.75rem] group-focus-visible:-rotate-[5deg]",
  "motion-safe:group-hover:-translate-y-1 motion-safe:group-focus-visible:-translate-y-1",
];
const FAN_IMAGE =
  "size-full object-cover opacity-80 grayscale transition-[filter,opacity,scale] duration-300 ease-out motion-reduce:transition-none group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0 motion-safe:group-focus-visible:scale-[1.04] motion-safe:group-hover:scale-[1.04]";

/** Three small cards fanned out in the tile's corner (shadcn.io's block tiles), each a little drawing. */
function Fan({ cards }: { cards: ReactNode[] }) {
  return (
    <>
      {FAN_POSES.map((pose, i) => (
        <span aria-hidden="true" className={cn(FAN_CARD, pose)} key={pose}>
          <span className={cn(FAN_IMAGE, "block")}>{cards[i % cards.length]}</span>
        </span>
      ))}
    </>
  );
}

/** One icon in a rounded square (shadcn.io's AI-agent tiles). */
function IconSquare({ icon }: { icon: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute flex motion-safe:group-focus-visible:-translate-y-1 motion-safe:group-hover:-translate-y-1 -end-5 -bottom-7 size-28 overflow-hidden rounded-[1.75rem] transition-[translate,border-color]",
        PANEL,
      )}
    >
      <span className="absolute inset-1.5 rounded-[1.375rem] border border-foreground/[0.05]" />
      <span className="absolute flex opacity-85 transition-[filter,opacity] group-hover:opacity-100 group-focus-visible:opacity-100 duration-300 ease-out motion-reduce:transition-none start-5.5 top-4.5 text-foreground/80 group-hover:text-foreground [&_svg]:size-12 [&_svg]:stroke-[1.25]">
        {icon}
      </span>
    </span>
  );
}

/** One icon in a circle (shadcn.io's framework tiles). */
function IconCircle({ icon }: { icon: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute flex motion-safe:group-focus-visible:-translate-y-1 motion-safe:group-hover:-translate-y-1 -end-4 -bottom-4 size-28 overflow-hidden rounded-full transition-[translate,border-color]",
        PANEL,
      )}
    >
      <span className="absolute inset-3 rounded-full opacity-0 transition-[opacity] group-hover:opacity-100 group-focus-visible:opacity-100 duration-300 ease-out motion-reduce:transition-none bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--foreground)_12%,transparent),transparent)]" />
      <span className="absolute inset-1.5 rounded-full border border-foreground/[0.06]" />
      <span className="absolute start-8 top-8 opacity-85 transition-[opacity] group-hover:opacity-100 group-focus-visible:opacity-100 duration-300 text-foreground/80 group-hover:text-foreground [&_svg]:size-12 [&_svg]:stroke-[1.25]">
        {icon}
      </span>
    </span>
  );
}

const STACK_CARD =
  "*:absolute *:flex *:size-20 *:origin-bottom *:justify-center *:rounded-[1.375rem] *:border *:border-foreground/[0.1] *:bg-background *:pt-3.5 *:text-foreground/75 *:bg-linear-to-b *:from-transparent *:to-foreground/[0.03] dark:*:from-foreground/[0.06] dark:*:to-foreground/[0.01] *:shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_14px_-2px_rgb(0_0_0/0.08)] dark:*:shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_9%,transparent),0_4px_14px_-2px_rgb(0_0_0/0.6)] *:transition-[translate,rotate,border-color,color] *:duration-300 *:ease-out *:motion-reduce:transition-none max-sm:*:size-[4.5rem] max-sm:*:rounded-[1.25rem] max-sm:*:pt-3 group-hover:*:border-foreground/[0.2] group-focus-visible:*:border-foreground/[0.2] group-hover:*:text-foreground group-focus-visible:*:text-foreground [&_svg]:size-7 [&_svg]:stroke-[1.5]";

/** Three small cards leaning together (shadcn.io's DESIGN.md tiles). */
function Stack({ icons }: { icons: ReactNode[] }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute flex transition-[translate] duration-300 ease-out motion-safe:group-focus-visible:-translate-y-1 motion-safe:group-hover:-translate-y-1 inset-0",
        STACK_CARD,
      )}
    >
      <span className="end-[6.25rem] -bottom-4 -rotate-[14deg] group-hover:-translate-x-2 group-hover:-rotate-[18deg] group-focus-visible:-translate-x-2 group-focus-visible:-rotate-[18deg] max-sm:end-[4.25rem]">
        {icons[0]}
      </span>
      <span className="end-[3.25rem] -bottom-5 -rotate-[4deg] group-hover:-translate-x-1 group-focus-visible:-translate-x-1 max-sm:end-[2.25rem]">
        {icons[1]}
      </span>
      <span className="end-1 -bottom-6 rotate-[7deg] group-hover:rotate-[10deg] group-focus-visible:rotate-[10deg]">
        {icons[2]}
      </span>
    </span>
  );
}

export type TileVisual =
  | { kind: "fan"; cards: ReactNode[] }
  | { kind: "square"; icon: ReactNode }
  | { kind: "circle"; icon: ReactNode }
  | { kind: "stack"; icons: ReactNode[] };

/** One tile: its name and a short line top-left, the picture in the corner, rings behind. */
export function Tile({
  href,
  title,
  sub,
  visual,
  className,
  style,
}: {
  href?: string;
  title: ReactNode;
  sub: ReactNode;
  visual: TileVisual;
  className?: string;
  style?: CSSProperties;
}) {
  const shape = visual.kind === "fan" ? "card" : visual.kind;
  const body = (
    <>
      <Rings shape={shape} />
      {visual.kind === "fan" ? <Fan cards={visual.cards} /> : null}
      {visual.kind === "square" ? <IconSquare icon={visual.icon} /> : null}
      {visual.kind === "circle" ? <IconCircle icon={visual.icon} /> : null}
      {visual.kind === "stack" ? <Stack icons={visual.icons} /> : null}
      <span className="absolute inset-x-5 top-5 flex flex-col gap-0.5" data-slot="sketch-label">
        <span className="text-pretty font-medium text-[0.9375rem] text-foreground leading-5 tracking-tight">{title}</span>
        <span className="text-muted-foreground text-xs tabular-nums leading-4">{sub}</span>
      </span>
    </>
  );
  return (
    <li className={className} style={style}>
      {href ? (
        href.startsWith("http") ? (
          <a className={TILE} data-sketch="" href={href} rel="noopener noreferrer" target="_blank">
            {body}
          </a>
        ) : (
          <Link className={TILE} data-sketch="" href={href}>
            {body}
          </Link>
        )
      ) : (
        <div className={TILE} data-sketch="">
          {body}
        </div>
      )}
    </li>
  );
}

/*
 * Small drawings for the tiles' cards, in the spirit of shadcn.io's own
 * (theirs are little pictures of each block): a walk card, a question, a
 * page and a note. Drawn with the page's colours, so light and dark both work.
 */
export function MiniWalk({ title, when, detail }: { title: string; when: string; detail?: string }) {
  return (
    <span className="flex size-full flex-col gap-1.5 p-3 text-[8px] leading-tight text-foreground">
      <span className="flex items-center justify-between">
        <span className="rounded-full bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">Walk</span>
        <span className="text-muted-foreground">{when}</span>
      </span>
      <span className="line-clamp-2 font-semibold text-[10px] tracking-tight">{title}</span>
      {detail ? <span className="truncate text-muted-foreground">{detail}</span> : null}
      <span className="mt-auto flex gap-1">
        <span className="h-3.5 flex-1 rounded-full bg-foreground" />
        <span className="h-3.5 w-8 rounded-full border border-foreground/20" />
      </span>
    </span>
  );
}

export function MiniQuestion({ question }: { question: string }) {
  return (
    <span className="flex size-full flex-col gap-1.5 p-3 text-[8px] leading-tight text-foreground">
      <span className="flex items-center gap-1.5">
        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground text-[8px] font-semibold text-background">
          ?
        </span>
        <span className="line-clamp-2 font-semibold text-[9px]">{question}</span>
      </span>
      <span className="h-1 w-11/12 rounded-full bg-muted-foreground/25" />
      <span className="h-1 w-10/12 rounded-full bg-muted-foreground/25" />
      <span className="h-1 w-7/12 rounded-full bg-muted-foreground/25" />
    </span>
  );
}

export function MiniPage({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <span className="flex size-full flex-col text-[8px] leading-tight text-foreground">
      <span className="flex items-center gap-1 border-b border-foreground/10 px-2.5 py-1.5">
        <span className="size-1.5 rounded-full bg-foreground/20" />
        <span className="size-1.5 rounded-full bg-foreground/20" />
        <span className="size-1.5 rounded-full bg-foreground/20" />
      </span>
      <span className="flex flex-1 flex-col gap-1.5 p-2.5">
        <span className="flex items-center gap-1.5 font-semibold text-[10px] [&_svg]:size-3">
          {icon}
          {title}
        </span>
        <span className="h-1 w-11/12 rounded-full bg-muted-foreground/25" />
        <span className="h-1 w-9/12 rounded-full bg-muted-foreground/25" />
        <span className="mt-auto h-3.5 w-14 rounded-full bg-foreground" />
      </span>
    </span>
  );
}

export function MiniNote({ text, icon }: { text: string; icon: ReactNode }) {
  return (
    <span className="flex size-full flex-col gap-2 p-3 text-foreground">
      <span className="flex size-6 items-center justify-center rounded-full bg-muted [&_svg]:size-3.5">{icon}</span>
      <span className="line-clamp-3 font-semibold text-[10px] leading-tight tracking-tight">{text}</span>
    </span>
  );
}
