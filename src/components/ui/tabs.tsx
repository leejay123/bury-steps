"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { TabStyle } from "@/lib/tab-style";

/**
 * Which look every tab bar uses (Settings → Site behaviour → Tabs), set
 * once in the root layout. "underline" is the shadcn-space tabs-05 style,
 * built into these components so every Tabs on the site follows the setting.
 */
const TabStyleContext = React.createContext<TabStyle>("standard");

export function TabStyleProvider({ style, children }: { style: TabStyle; children: React.ReactNode }) {
  return <TabStyleContext.Provider value={style}>{children}</TabStyleContext.Provider>;
}

/** The underline style's moving parts, shared by one Tabs' list, triggers and panels. */
type UnderlineState = {
  /** Unique per Tabs, so two tab bars on one page don't share a sliding line. */
  id: string;
  active: string | undefined;
  hovered: string | null;
  setHovered: (value: string | null) => void;
  /** 1: the new tab is right of the old one (its content slides in from the right); -1: left. */
  direction: 1 | -1;
  /** Only after someone changes tab — the first tab doesn't slide in on page load. */
  changed: boolean;
};

const UnderlineContext = React.createContext<UnderlineState | null>(null);

function Tabs({
  className,
  defaultValue,
  onValueChange,
  value,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const style = React.useContext(TabStyleContext);
  const id = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [own, setOwn] = React.useState(defaultValue);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [changed, setChanged] = React.useState(false);
  const active = value ?? own;

  const handleChange = React.useCallback(
    (next: string) => {
      // Which way to slide: the two tabs' places in this bar.
      const order = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]') ?? []).map(
        (el) => el.dataset.value,
      );
      setDirection(order.indexOf(next) >= order.indexOf(active) ? 1 : -1);
      setChanged(true);
      setOwn(next);
      onValueChange?.(next);
    },
    [active, onValueChange],
  );

  const underline = React.useMemo<UnderlineState | null>(
    () => (style === "underline" ? { id, active, hovered, setHovered, direction, changed } : null),
    [style, id, active, hovered, direction, changed],
  );

  return (
    <UnderlineContext.Provider value={underline}>
      <TabsPrimitive.Root
        className={cn("flex flex-col gap-2", className)}
        data-slot="tabs"
        data-tab-style={style}
        defaultValue={defaultValue}
        onValueChange={handleChange}
        ref={rootRef}
        value={value}
        {...props}
      />
    </UnderlineContext.Provider>
  );
}

function TabsList({ className, onMouseLeave, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  const underline = React.useContext(UnderlineContext);
  return (
    <TabsPrimitive.List
      className={cn(
        underline
          ? "text-muted-foreground flex h-auto w-full items-end justify-start gap-0 overflow-x-auto rounded-none border-b bg-transparent p-0 [scrollbar-width:none]"
          : "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className,
      )}
      data-slot="tabs-list"
      onMouseLeave={(event) => {
        underline?.setHovered(null);
        onMouseLeave?.(event);
      }}
      {...props}
    />
  );
}

function TabsTrigger({
  children,
  className,
  onMouseEnter,
  value,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const underline = React.useContext(UnderlineContext);

  if (!underline) {
    return (
      <TabsPrimitive.Trigger
        className={cn(
          "data-[state=active]:bg-background data-[state=active]:shadow-sm focus-visible:ring-ring/50 text-foreground inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        data-slot="tabs-trigger"
        data-value={value}
        value={value}
        {...props}
      >
        {children}
      </TabsPrimitive.Trigger>
    );
  }

  const isActive = underline.active === value;
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "focus-visible:ring-ring/50 relative flex shrink-0 cursor-pointer items-center justify-center rounded-none bg-transparent text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        className,
      )}
      data-slot="tabs-trigger"
      data-value={value}
      onMouseEnter={(event) => {
        underline.setHovered(value);
        onMouseEnter?.(event);
      }}
      value={value}
      {...props}
    >
      {/* The hover highlight covers the words only, not the line underneath. */}
      <span className="relative z-10 flex items-center gap-1.5 rounded-md px-4 py-3">
        {underline.hovered === value ? (
          <motion.span
            animate={{ opacity: 1 }}
            className="pointer-events-none absolute inset-0 rounded-md bg-muted/70"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            layoutId={`${underline.id}-hover`}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        ) : null}
        <span className="relative z-10 flex items-center gap-1.5">{children}</span>
      </span>
      {isActive ? (
        <motion.span
          className="absolute right-0 bottom-[-1px] left-0 h-[2px] bg-primary"
          initial={false}
          layoutId={`${underline.id}-line`}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      ) : null}
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({ className, style, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  const underline = React.useContext(UnderlineContext);
  return (
    <TabsPrimitive.Content
      className={cn(
        "flex-1 outline-none",
        // The chosen tab's content slides in from its side (globals.css,
        // tab-slide-in); not on page load, and not with reduced motion.
        underline?.changed && "motion-safe:data-[state=active]:animate-[tab-slide-in_0.35s_cubic-bezier(0.22,1,0.36,1)]",
        className,
      )}
      data-slot="tabs-content"
      style={underline ? ({ "--tab-slide-from": `${underline.direction * 48}px`, ...style } as React.CSSProperties) : style}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
