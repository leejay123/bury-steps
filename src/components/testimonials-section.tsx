"use client";

import type { ComponentProps } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/ui/grid-pattern";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FullWidthDivider } from "@/components/full-width-divider";
import { GridFiller } from "@/components/grid-filler";
import { HeroCopy } from "@/components/hero-copy";
import type { TestimonialView } from "@/lib/testimonials";

export function TestimonialsSection({
  intro,
  testimonials,
  title,
}: {
  intro: string;
  testimonials: TestimonialView[];
  title: string;
}) {
  if (testimonials.length === 0) return null;

  return (
    <section>
      <HeroCopy eyebrow={null} title={title} titleAs="h2">
        <p>{intro}</p>
      </HeroCopy>
      <div className="relative">
        <FullWidthDivider position="top" />
        <div className="grid w-full grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
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
