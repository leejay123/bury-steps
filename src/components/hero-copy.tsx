"use client";

import { useMemo, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionEase } from "@/components/motion";
import { DotPattern } from "@/components/ui/dot-pattern";

export function HeroCopy({
  eyebrow = "Support · Together · Empathy · Pace · Steps",
  title,
  titleAs: Title = "h1",
  children,
  actions,
  after,
  dotPattern = false,
}: {
  eyebrow?: string | null;
  title: string;
  titleAs?: "h1" | "h2";
  children: ReactNode;
  actions?: ReactNode;
  after?: ReactNode;
  dotPattern?: boolean;
}) {
  const reduce = useReducedMotion();
  // Recreated (and thus new-by-reference) object literals here would make
  // every motion.div below re-evaluate its animation on every render of this
  // component — including every keystroke when the `after` slot is a
  // controlled search input (see FaqsSection). Memoize on `reduce` alone so
  // re-renders with unrelated prop changes (like a search term) are cheap.
  const item = useMemo(
    () => ({
      hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: motionEase },
      },
    }),
    [reduce],
  );
  const containerVariants = useMemo(
    () => ({
      hidden: {},
      show: { transition: { staggerChildren: reduce ? 0 : 0.08 } },
    }),
    [reduce],
  );

  return (
    <motion.div
      animate="show"
      className="relative flex flex-col items-center justify-center gap-5 px-4 py-12 md:px-6 md:py-20 lg:py-24"
      initial="hidden"
      variants={containerVariants}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-1 size-full overflow-hidden">
        {dotPattern ? (
          <DotPattern className="[mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
        ) : (
          <div
            className={cn(
              "absolute -inset-x-20 inset-y-0 z-0 rounded-full",
              "bg-[radial-gradient(ellipse_at_center,theme(--color-foreground/.08),transparent,transparent)]",
              "blur-[50px]",
            )}
          />
        )}
      </div>

      {eyebrow ? (
        <motion.p
          className="text-center text-xs font-medium tracking-[0.18em] text-primary uppercase"
          variants={item}
        >
          {eyebrow}
        </motion.p>
      ) : null}

      <motion.div variants={item}>
        <Title
          className={cn(
            "max-w-3xl text-balance text-center text-3xl text-foreground md:text-5xl lg:text-6xl",
          )}
        >
          {title}
        </Title>
      </motion.div>

      <motion.div
        className="max-w-2xl text-center text-muted-foreground text-sm tracking-wide sm:text-lg"
        variants={item}
      >
        {children}
      </motion.div>

      {actions ? (
        <motion.div className="flex w-fit flex-wrap items-center justify-center gap-3 pt-2" variants={item}>
          {actions}
        </motion.div>
      ) : null}

      {after ? (
        <motion.div className="flex w-full max-w-3xl justify-center" variants={item}>
          {after}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
