import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/ui/grid-pattern";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FullWidthDivider } from "@/components/full-width-divider";
import { GridFiller } from "@/components/grid-filler";
import { HeroCopy } from "@/components/hero-copy";
import type { TestimonialView } from "@/lib/testimonials";

export function TestimonialsSection({
  testimonials,
}: {
  testimonials: TestimonialView[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <section>
      <HeroCopy eyebrow={null} title="From the group" titleAs="h2">
        <p>A few words from people who walk with us on Sundays.</p>
      </HeroCopy>
      <div className="relative grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
        <FullWidthDivider position="top" />
        {testimonials.map((testimonial) => (
          <TestimonialsCard key={testimonial.id} testimonial={testimonial} />
        ))}
        <GridFiller
          className="bg-background"
          lgColumns={3}
          smColumns={2}
          totalItems={testimonials.length}
        />
        <FullWidthDivider position="bottom" />
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
        {image ? <AvatarImage alt={`${name}'s profile picture`} src={image} /> : null}
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
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
