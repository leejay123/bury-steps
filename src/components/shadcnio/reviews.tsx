"use client";

import { useState } from "react";
import type { TestimonialView } from "@/lib/testimonials";
import { REVIEW_GRID } from "./grids";
import { BUTTON_SMALL_OUTLINE } from "./parts";

import { FILLER } from "./more-rows";
const FIRST = 4;

/**
 * Members' reviews in shadcn.io's grid: one full row to start, and Read more
 * opens the rest in place, as the original homepage's reviews do. Rows are
 * always full; a short last row is finished with striped filler cells.
 */
export function ShadcnReviews({ testimonials }: { testimonials: TestimonialView[] }) {
  const [open, setOpen] = useState(false);
  const more = testimonials.length > FIRST;
  const shown = open || !more ? testimonials : testimonials.slice(0, FIRST);
  // Two across on tablets, four on computers: fill whatever is left of the last row.
  const fillLarge = (4 - (shown.length % 4)) % 4;
  const fillTablet = shown.length % 2;
  return (
    <>
      <ul aria-label="What members say" className={REVIEW_GRID}>
        {shown.map((review) => (
          <li key={review.id}>
            <a className="group" href="#faq">
              <strong>{review.name}</strong>
              <small>{review.role}</small>
              <blockquote className="relative z-10 mt-3 min-h-0 flex-1 text-pretty text-muted-foreground text-sm leading-5 transition-[color] group-hover:text-foreground group-focus-visible:text-foreground duration-300 ease-out motion-reduce:transition-none">
                <span aria-hidden="true" className="float-end h-[calc(100%-5.25rem)] w-px" />
                <span
                  aria-hidden="true"
                  className="float-end clear-end size-21 [shape-outside:circle(4rem_at_4rem_4rem)] rtl:[shape-outside:circle(4rem_at_1.25rem_4rem)]"
                />
                <p>“{review.quote}”</p>
              </blockquote>
              <i />
              <span aria-hidden="true">
                {review.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" decoding="async" height={48} loading="lazy" src={review.image} width={48} />
                ) : (
                  <span>{review.name.charAt(0)}</span>
                )}
              </span>
            </a>
          </li>
        ))}
        {Array.from({ length: fillLarge }, (_, i) => (
          <li
            aria-hidden="true"
            className={`${FILLER} ${i < fillTablet ? "max-sm:hidden" : "hidden lg:block"}`}
            key={`fill-${i}`}
          />
        ))}
      </ul>
      {more ? (
        <div className="flex justify-center border-t px-5 py-3">
          <button aria-expanded={open} className={BUTTON_SMALL_OUTLINE} onClick={() => setOpen(!open)} type="button">
            {open ? "Show less" : "Read more"}
          </button>
        </div>
      ) : null}
    </>
  );
}
