"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import type { TestimonialView } from "@/lib/testimonials";
import { cn } from "@/lib/utils";
import { BUTTON_SMALL_OUTLINE } from "./parts";

/**
 * The Quotes section's other looks (chosen in the page designer), edge to
 * edge like the original: full-width strips and rows, lines between them.
 *
 * - carousel: one big quote at a time, ‹ › at the sides, names along the bottom
 * - rows:     each quote a full-width row, the name beside it
 * - featured: one big quote, two smaller ones beside it, the rest under them
 */
export type QuotesLook = "original" | "carousel" | "rows" | "featured";

export function isQuotesLook(value: unknown): value is QuotesLook {
  return value === "original" || value === "carousel" || value === "rows" || value === "featured";
}

/** The switches each look takes (the page designer's settings). */
export type QuotesOptions = {
  /** A Read more button (off: every quote shows from the start). */
  readMore: boolean;
  /** How many show before Read more. */
  first: number;
  /** Photos (or the first letter when there's none). */
  photos: boolean;
  /** The line under each name ("Walks most Sundays"). */
  roles: boolean;
  /** Carousel: moves on to the next quote by itself. */
  autoplay: boolean;
};

const PAD = "px-5 md:px-12";

function Avatar({ review, size = "md" }: { review: TestimonialView; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-11" : "size-10";
  return (
    <span
      aria-hidden
      className={cn(box, "flex shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted font-semibold text-muted-foreground")}
    >
      {review.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="size-full object-cover" decoding="async" loading="lazy" src={review.image} />
      ) : (
        review.name.charAt(0)
      )}
    </span>
  );
}

function Who({ review, o, size }: { review: TestimonialView; o: QuotesOptions; size?: "md" | "lg" }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      {o.photos ? <Avatar review={review} size={size} /> : null}
      <span className="flex min-w-0 flex-col text-start">
        <strong className="font-semibold text-sm">{review.name}</strong>
        {o.roles && review.role ? <small className="text-muted-foreground text-sm">{review.role}</small> : null}
      </span>
    </span>
  );
}

/** Read more / Show less, in a white strip along the bottom (as the original). */
function MoreStrip({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="flex justify-center border-t bg-background px-5 py-3">
      <button aria-expanded={open} className={BUTTON_SMALL_OUTLINE} onClick={onToggle} type="button">
        {open ? "Show less" : "Read more"}
      </button>
    </div>
  );
}

/** How many quotes to show now, and whether there's a Read more for the rest. */
function useMore(count: number, o: QuotesOptions, first = o.first) {
  const [open, setOpen] = useState(false);
  const more = o.readMore && count > first;
  return { shown: more && !open ? first : count, more, open, toggle: () => setOpen(!open) };
}

/** A: one big quote at a time, with ‹ › at the sides and the names along the bottom. */
export function QuotesCarouselLook({ quotes, o }: { quotes: TestimonialView[]; o: QuotesOptions }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = quotes.length;
  const go = (step: number) => setIndex((current) => (current + step + count) % count);
  // Moves on every 8 seconds, if chosen; never while a pointer or keyboard is
  // on it, or for people who've asked their device for less motion.
  useEffect(() => {
    if (!o.autoplay || paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((current) => (current + 1) % count), 8000);
    return () => window.clearInterval(id);
  }, [o.autoplay, paused, count]);
  const review = quotes[Math.min(index, count - 1)];
  return (
    <div
      aria-roledescription="carousel"
      className="border-t"
      onBlur={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="What members say"
    >
      <div className="grid grid-cols-[3rem_minmax(0,1fr)_3rem] md:grid-cols-[6rem_minmax(0,1fr)_6rem]">
        <button
          aria-label="Previous quote"
          className="flex items-center justify-center border-e text-muted-foreground hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          onClick={() => go(-1)}
          type="button"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <figure aria-live={o.autoplay ? "off" : "polite"} className="flex min-h-72 flex-col items-center justify-center gap-7 px-5 py-12 text-center md:px-16">
          <blockquote className="max-w-3xl text-balance font-medium text-lg leading-snug tracking-tight sm:text-xl md:text-3xl">
            “{review.quote}”
          </blockquote>
          <figcaption>
            <Who o={o} review={review} size="lg" />
          </figcaption>
        </figure>
        <button
          aria-label="Next quote"
          className="flex items-center justify-center border-s text-muted-foreground hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          onClick={() => go(1)}
          type="button"
        >
          <ChevronRight aria-hidden className="size-5" />
        </button>
      </div>
      {/* Everyone's name in one strip: pick a quote (scrolls sideways on a phone). */}
      <div aria-label="Choose a quote" className="flex overflow-x-auto border-t [scrollbar-width:none]" role="group">
        {quotes.map((item, i) => {
          const on = i === index;
          return (
            <button
              aria-pressed={on}
              className={cn(
                "h-13 min-w-fit flex-1 whitespace-nowrap px-5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                i > 0 && "border-l",
                on
                  ? "bg-muted/60 font-semibold text-foreground shadow-[inset_0_-2px_0_var(--foreground)]"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
              key={item.id}
              onClick={() => setIndex(i)}
              type="button"
            >
              {item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** B: each quote a full-width row, the name beside it (above it on a phone). */
export function QuotesRowsLook({ quotes, o }: { quotes: TestimonialView[]; o: QuotesOptions }) {
  const { shown, more, open, toggle } = useMore(quotes.length, o);
  return (
    <div className="border-t">
      {quotes.slice(0, shown).map((review, i) => (
        <figure className={cn("grid md:grid-cols-[18rem_minmax(0,1fr)]", i > 0 && "border-t")} key={review.id}>
          <figcaption className={cn(PAD, "flex items-center pt-6 md:border-e md:py-7")}>
            <Who o={o} review={review} />
          </figcaption>
          <blockquote className={cn(PAD, "py-5 text-pretty text-base text-muted-foreground leading-relaxed md:py-7 md:text-lg")}>
            “{review.quote}”
          </blockquote>
        </figure>
      ))}
      {more ? <MoreStrip onToggle={toggle} open={open} /> : null}
    </div>
  );
}

/** C: the first quote big, the next two beside it; Read more adds the rest as rows. */
export function QuotesFeaturedLook({ quotes, o }: { quotes: TestimonialView[]; o: QuotesOptions }) {
  const [lead, ...others] = quotes;
  const beside = others.slice(0, 2);
  const rest = others.slice(2);
  const { shown, more, open, toggle } = useMore(rest.length, o, 0);
  return (
    <div className="border-t">
      <div className={cn("grid", beside.length > 0 && "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]")}>
        <figure className={cn(PAD, "flex flex-col justify-between gap-8 bg-muted/30 py-10 md:py-12", beside.length > 0 && "lg:border-e")}>
          <Quote aria-hidden className="size-8 fill-muted-foreground/25 text-transparent" />
          <blockquote className="text-pretty font-medium text-2xl leading-snug tracking-tight md:text-3xl">{lead.quote}</blockquote>
          <figcaption>
            <Who o={o} review={lead} size="lg" />
          </figcaption>
        </figure>
        {beside.length > 0 ? (
          <div className="flex flex-col max-lg:border-t">
            {beside.map((review, i) => (
              <figure className={cn(PAD, "flex flex-1 flex-col justify-between gap-5 py-8 lg:px-8", i > 0 && "border-t")} key={review.id}>
                <blockquote className="text-pretty text-muted-foreground leading-relaxed">“{review.quote}”</blockquote>
                <figcaption>
                  <Who o={{ ...o, photos: false }} review={review} />
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </div>
      {/* The rest (when Read more is on, after it's pressed; when it's off, straight away). */}
      {rest.slice(0, shown).map((review) => (
        <figure className="grid border-t md:grid-cols-[18rem_minmax(0,1fr)]" key={review.id}>
          <figcaption className={cn(PAD, "flex items-center pt-6 md:border-e md:py-7")}>
            <Who o={o} review={review} />
          </figcaption>
          <blockquote className={cn(PAD, "py-5 text-pretty text-muted-foreground leading-relaxed md:py-7")}>“{review.quote}”</blockquote>
        </figure>
      ))}
      {more ? <MoreStrip onToggle={toggle} open={open} /> : null}
    </div>
  );
}
