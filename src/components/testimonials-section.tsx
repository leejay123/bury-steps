"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { ChevronDownIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/ui/grid-pattern";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FullWidthDivider } from "@/components/full-width-divider";
import { GridFiller } from "@/components/grid-filler";
import type { SectionBgPattern } from "@/lib/section-background";
import { HeroCopy } from "@/components/hero-copy";
import type { TestimonialView } from "@/lib/testimonials";

// Efferd's wall of love: the first few cards plus a faded peek of the next.
const INITIALLY_SHOWN = 3;
const PEEK_PX = 72;
const FADE_MASK = "linear-gradient(to bottom, black 70%, transparent)";

export function TestimonialsSection({
  bgPattern = "none",
  eyebrow,
  intro,
  testimonials,
  title,
}: {
  /** Settings → Homepage layout → Background patterns. Drawn behind the
   * heading only: the cards below are solid and would hide it. */
  bgPattern?: SectionBgPattern;
  eyebrow: string;
  intro: string;
  testimonials: TestimonialView[];
  title: string;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null);
  const collapsible = testimonials.length > INITIALLY_SHOWN;

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !collapsible) return;
    const measure = () => {
      const last = grid.children[INITIALLY_SHOWN - 1] as HTMLElement | undefined;
      if (!last) return;
      const lastBottom = last.getBoundingClientRect().bottom - grid.getBoundingClientRect().top;
      setCollapsedHeight(Math.min(grid.scrollHeight, Math.round(lastBottom + PEEK_PX)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [collapsible]);

  if (testimonials.length === 0) return null;
  const clipped = collapsible && !expanded;
  // Open to "auto" so the height is always the grid's real size.
  const height = !collapsible || expanded ? "auto" : (collapsedHeight ?? "28rem");

  return (
    <section>
      <HeroCopy bgPattern={bgPattern} eyebrow={eyebrow || null} title={title} titleAs="h2">
        <p>{intro}</p>
      </HeroCopy>
      <div className="relative">
        <FullWidthDivider position="top" />
        <motion.div
          animate={{ height }}
          className="overflow-hidden"
          initial={false}
          style={clipped ? { maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK } : undefined}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        >
          <div
            className="grid w-full grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3"
            ref={gridRef}
          >
            {testimonials.map((testimonial) => (
              <TestimonialsCard className="h-full" key={testimonial.id} testimonial={testimonial} />
            ))}
            <GridFiller
              className="bg-background"
              lgColumns={3}
              smColumns={2}
              totalItems={testimonials.length}
            />
          </div>
        </motion.div>
      </div>
      {collapsible ? (
        <div className="relative flex justify-center py-3">
          <FullWidthDivider position="top" />
          <button
            aria-expanded={expanded}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            onClick={() => setExpanded((open) => !open)}
            type="button"
          >
            {expanded ? "See less" : "See more"}
            <ChevronDownIcon
              aria-hidden
              className={cn("size-4 transition-transform duration-300", expanded && "rotate-180")}
            />
          </button>
        </div>
      ) : null}
    </section>
  );
}

function TestimonialsCard({
  testimonial,
  className,
  ...props
}: ComponentProps<"figure"> & {
  testimonial: TestimonialView;
}) {
  const { quote, image, name, role } = testimonial;
  return (
    <figure
      className={cn(
        "relative grid grid-cols-[auto_1fr] gap-x-3 overflow-hidden bg-background p-4",
        className,
      )}
      {...props}
    >
      <div className="mask-[radial-gradient(farthest-side_at_top,white,transparent)] pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 size-full">
        <GridPattern
          className="absolute inset-0 size-full stroke-border"
          height={25}
          width={25}
          x={-12}
          y={4}
        />
      </div>

      <Avatar className="size-8 rounded-full">
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        {image ? (
          // next/image (not Radix's AvatarImage, which is a plain <img>)
          // so a full-size upload gets resized down to this 32px circle
          // instead of being downloaded in full to show a thumbnail.
          <Image
            alt={`${name}'s profile picture`}
            className="absolute inset-0 object-cover"
            fill
            sizes="32px"
            src={image}
          />
        ) : null}
      </Avatar>
      <div>
        <figcaption className="-mt-0.5 -space-y-0.5">
          <cite className="text-sm not-italic md:text-base">{name}</cite>
          {role ? (
            <span className="block font-light text-[11px] text-muted-foreground tracking-tight">
              {role}
            </span>
          ) : null}
        </figcaption>
        <blockquote className="mt-3">
          <p className="text-foreground/80 text-sm tracking-wide">{quote}</p>
        </blockquote>
      </div>
    </figure>
  );
}
