"use client";

import { useState, type ComponentProps } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { TestimonialView } from "@/lib/testimonials";

// Beyond this many quotes the wall starts clipped behind a fade.
const COLLAPSE_AFTER = 6;

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
  const [expanded, setExpanded] = useState(false);
  if (testimonials.length === 0) return null;

  const collapsible = testimonials.length > COLLAPSE_AFTER;
  const clipped = collapsible && !expanded;

  return (
    <section className="flex flex-col gap-8 px-4 py-10 md:px-6 md:py-14">
      <div className="flex flex-col gap-1.5">
        {eyebrow ? (
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h2>
        {intro ? <p className="text-muted-foreground">{intro}</p> : null}
      </div>
      <div className="relative">
        <div
          className={cn(
            "columns-1 gap-4 sm:columns-2 lg:columns-3",
            clipped && "max-h-[36rem] overflow-hidden",
          )}
        >
          {testimonials.map((testimonial) => (
            <TestimonialsCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
        {clipped ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        ) : null}
      </div>
      {collapsible ? (
        <div className="flex justify-center">
          <Button onClick={() => setExpanded((open) => !open)} variant="outline">
            {expanded ? "Show less" : "See more"}
          </Button>
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
      className={cn("mb-4 flex break-inside-avoid flex-col gap-3 rounded-xl border bg-background p-4", className)}
      {...props}
    >
      <figcaption className="flex items-center gap-3">
        <Avatar className="size-9 rounded-full">
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          {image ? (
            // next/image so a full-size upload is resized to the avatar.
            <Image
              alt={`${name}'s profile picture`}
              className="absolute inset-0 object-cover"
              fill
              sizes="36px"
              src={image}
            />
          ) : null}
        </Avatar>
        <div className="flex flex-col">
          <cite className="text-sm font-medium not-italic text-foreground">{name}</cite>
          {role ? <span className="text-xs text-muted-foreground">{role}</span> : null}
        </div>
      </figcaption>
      <blockquote>
        <p className="text-sm leading-relaxed text-foreground/80">{quote}</p>
      </blockquote>
    </figure>
  );
}
