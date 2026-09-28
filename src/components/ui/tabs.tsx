"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion, useReducedMotion, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

// Animate UI's animated tabs, kept on Radix for keyboard and screen-reader
// behaviour: a pill slides behind the chosen trigger, and panels wrapped in
// <TabsContents> slide sideways (the old one blurring out) while the height
// eases to the new panel.

const SPRING: Transition = { type: "spring", stiffness: 300, damping: 30, bounce: 0, restDelta: 0.01 };
const PILL_SPRING: Transition = { type: "spring", stiffness: 200, damping: 25 };

type TabsContextValue = { value: string | undefined; pillId: string };
const TabsContext = React.createContext<TabsContextValue>({ value: undefined, pillId: "" });

function Tabs({
  className,
  defaultValue,
  onValueChange,
  value: controlledValue,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const value = controlledValue ?? uncontrolledValue;
  const pillId = React.useId();

  return (
    <TabsContext.Provider value={{ value, pillId }}>
      <TabsPrimitive.Root
        className={cn("flex flex-col gap-2", className)}
        data-slot="tabs"
        onValueChange={(next) => {
          if (controlledValue === undefined) setUncontrolledValue(next);
          onValueChange?.(next);
        }}
        value={value}
        {...props}
      />
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]", className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, children, value, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const tabs = React.useContext(TabsContext);
  const active = tabs.value === value;
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:text-foreground text-muted-foreground focus-visible:ring-ring/50 relative inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors duration-300 focus-visible:ring-[3px] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      value={value}
      {...props}
    >
      {active ? (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-md border border-transparent bg-background shadow-sm dark:border-input dark:bg-input/30"
          layoutId={tabs.pillId}
          transition={PILL_SPRING}
        />
      ) : null}
      <span className="relative inline-flex items-center gap-1.5">{children}</span>
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />;
}

type TabsContentElement = React.ReactElement<React.ComponentProps<typeof TabsPrimitive.Content>>;

/**
 * Wrap the <TabsContent> panels in this to slide between them. Every panel
 * stays mounted side by side; the row moves and the box's height follows
 * whichever panel is showing.
 */
function TabsContents({ className, children }: { className?: string; children: React.ReactNode }) {
  const { value } = React.useContext(TabsContext);
  const reduced = useReducedMotion();
  const panels = React.Children.toArray(children).filter(React.isValidElement) as TabsContentElement[];
  const activeIndex = Math.max(0, panels.findIndex((panel) => panel.props.value === value));
  const paneRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const [height, setHeight] = React.useState<number | "auto">("auto");
  const transition = reduced ? { duration: 0 } : SPRING;

  React.useEffect(() => {
    const pane = paneRefs.current[activeIndex];
    if (!pane) return;
    const measure = () => setHeight(pane.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    return () => observer.disconnect();
  }, [activeIndex]);

  return (
    <motion.div
      animate={{ height }}
      className={cn("-mx-2 overflow-hidden", className)}
      data-slot="tabs-contents"
      initial={false}
      transition={transition}
    >
      <motion.div
        animate={{ x: `${activeIndex * -100}%` }}
        className="flex items-start"
        initial={false}
        transition={transition}
      >
        {panels.map((panel, index) => {
          const active = index === activeIndex;
          return (
            <motion.div
              animate={{ filter: active || reduced ? "blur(0px)" : "blur(4px)" }}
              className="w-full shrink-0 px-2"
              initial={false}
              key={panel.key ?? index}
              ref={(el) => {
                paneRefs.current[index] = el;
              }}
              transition={PILL_SPRING}
            >
              {React.cloneElement(panel, { forceMount: true, inert: !active })}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent };
