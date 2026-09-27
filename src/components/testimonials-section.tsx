"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { ChevronDownIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/ui/grid-pattern";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FullWidthDivider } from "@/components/full-width-divider";
import { GridFiller } from "@/components/grid-filler";
import { HeroCopy } from "@/components/hero-copy";
import type { TestimonialView } from "@/lib/testimonials";

// Roughly two rows of cards on desktop before the fade kicks in.
const COLLAPSED_HEIGHT_PX = 420;

export function TestimonialsSection({
  eyebrow,
  intro,
  testimonials,
  title,
}: {
  eyebrow: string;
  intro: string;
  testimonials: TestimonialView[];
  title: string;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  // Efferd-style "See more": clip by height, and only offer the button when
  // there's actually something hidden at the current screen width.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => setOverflows(grid.scrollHeight > COLLAPSED_HEIGHT_PX + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  if (testimonials.length === 0) return null;
  const clipped = overflows && !expanded;

  return (
    <section>
      <HeroCopy eyebrow={eyebrow || null} title={title} titleAs="h2">
        <p>{intro}</p>
      </HeroCopy>
      <div className="relative">
        <FullWidthDivider position="top" />
        <div
          className="grid w-full grid-cols-1 gap-px overflow-hidden bg-border sm:grid-cols-2 lg:grid-cols-3"
          ref={gridRef}
          style={clipped ? { maxHeight: COLLAPSED_HEIGHT_PX } : undefined}
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
        {clipped ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        ) : null}
      </div>
      {overflows ? (
        <div className="relative flex justify-center py-3">
          <FullWidthDivider position="top" />
          <button
            aria-expanded={expanded}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            onClick={() => setExpanded((open) => !open)}
            type="button"
          >
            {expanded ? "Show less" : "See more"}
            <ChevronDownIcon aria-hidden className={cn("size-4 transition-transform", expanded && "rotate-180")} />
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
