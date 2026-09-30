"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HeroGuestActions } from "@/components/hero-guest-actions";
import { SAMPLE_WALK_PHOTOS } from "@/lib/sample-walk-photos";
import type { SlideView } from "@/lib/slides";
import type { SectionBgPattern } from "@/lib/section-background";
import { SectionBackground } from "@/components/section-background";
import { cn } from "@/lib/utils";

/**
 * Four photo heroes (Settings → Homepage layout → Hero style), picked from
 * the Parallax design options: Sideways strip, Tiles fall into place,
 * Diagonal rows and Accordion panels. All use the Hero photos,
 * topped up with sample walking photos, and keep the name and buttons close
 * to the pictures — no tall empty stretches. Scroll effects run while the
 * hero scrolls away, so nothing has to be pinned in place.
 */

export type PhotoHeroProps = {
  /** Settings → Homepage layout → Hero style → Background (Sideways strip,
   * Tiles and Accordion; Diagonal rows is all photos, so it has none). */
  bgPattern?: SectionBgPattern;
  slides: SlideView[];
  isSignedIn: boolean;
  siteName: string;
  siteTagline: string;
};

type Photo = { src: string; title: string };

/** The owner's photos first, then samples, until there are `count`. */
function heroPhotos(slides: SlideView[], count: number): Photo[] {
  const own = slides.map((slide) => ({ src: slide.src, title: slide.alt }));
  const samples = SAMPLE_WALK_PHOTOS.map((sample) => ({ src: sample.src, title: sample.alt }));
  const pool = [...own, ...samples];
  return Array.from({ length: Math.max(count, own.length) }, (_, i) => pool[i % pool.length]);
}

function PhotoImg({ photo, className, sizes = "(max-width: 640px) 45vw, 280px", priority = false }: {
  photo: Photo;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  // Through Next's image service: each card gets a copy sized for it (and
  // WebP/AVIF), not the full 2000px upload. Not lazy: these are at the top
  // of the page, and lazy pictures inside moving rows stayed blank.
  return (
    <Image
      alt=""
      className={cn("size-full object-cover", className)}
      height={480}
      loading="eager"
      priority={priority}
      sizes={sizes}
      src={photo.src}
      width={640}
    />
  );
}

function HeroCopy({
  isSignedIn,
  siteName,
  siteTagline,
  className,
}: Omit<PhotoHeroProps, "slides" | "bgPattern"> & { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <h1 className="text-headline font-medium tracking-tight text-balance">{siteName}</h1>
      {siteTagline ? <p className="max-w-xl text-intro text-pretty text-muted-foreground">{siteTagline}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {isSignedIn ? (
          <Button asChild>
            <Link href="/walks">
              See the walks <ArrowRightIcon />
            </Link>
          </Button>
        ) : (
          <HeroGuestActions className="contents" />
        )}
      </div>
    </div>
  );
}

/** The chosen pattern behind the whole hero, under the name and photos. */
function HeroPattern({ pattern }: { pattern?: SectionBgPattern }) {
  if (!pattern || pattern === "none") return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <SectionBackground pattern={pattern} />
    </div>
  );
}

/** Framed like the other heroes: bottom hairline and corner crosses. */
function HeroFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="relative">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <FullWidthDivider position="bottom" />
      <section className={cn("relative isolate overflow-hidden", className)}>{children}</section>
    </div>
  );
}

/** 0 → 1 as the hero scrolls from the top of the page up out of view. */
function useHeroProgress(ref: React.RefObject<HTMLElement | null>) {
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  return useSpring(scrollYProgress, { stiffness: 220, damping: 40 });
}

const copyPadding = "px-4 pt-10 sm:px-6 sm:pt-12";

/* ------------------------------------------------------------------ */
/* Sideways strip                                                      */

/** The name and buttons above one row of tall photos that slides sideways as you scroll. */
export function HeroStripHome({ bgPattern, slides, ...copy }: PhotoHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const progress = useHeroProgress(ref);
  const x = useTransform(progress, [0, 1], ["0%", "-32%"]);
  const photos = heroPhotos(slides, 10);

  return (
    <div className="relative">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <FullWidthDivider position="bottom" />
      <section className="relative isolate overflow-hidden pb-8 sm:pb-10" ref={ref}>
        <HeroPattern pattern={bgPattern} />
        <HeroCopy {...copy} className={copyPadding} />
        <motion.ul aria-hidden className="mt-8 flex w-max gap-4 px-4 will-change-transform sm:px-6" style={{ x }}>
          {photos.map((photo, i) => (
            <li className="relative aspect-[3/4] w-44 shrink-0 overflow-hidden rounded-2xl bg-muted sm:w-56" key={i}>
              <PhotoImg photo={photo} />
              {photo.title ? (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 pt-8 pb-2.5 text-xs font-medium text-white">
                  {photo.title}
                </span>
              ) : null}
            </li>
          ))}
        </motion.ul>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tiles fall into place                                               */

/** Photos start tossed about and settle one by one into a tidy grid under the name. */
export function HeroTilesHome({ bgPattern, slides, ...copy }: PhotoHeroProps) {
  const reduce = useReducedMotion();
  const photos = heroPhotos(slides, 8).slice(0, 8);

  return (
    <HeroFrame className="pb-8 sm:pb-10">
      <HeroPattern pattern={bgPattern} />
      <HeroCopy {...copy} className={copyPadding} />
      <ul aria-hidden className="mt-8 grid grid-cols-3 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        {photos.map((photo, i) => (
          <motion.li
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
            className={cn("aspect-[4/3] overflow-hidden rounded-xl bg-muted", i >= 6 && "hidden sm:block")}
            initial={
              reduce
                ? false
                : { opacity: 0, x: ((i * 73) % 160) - 80, y: 90 + ((i * 41) % 90), rotate: ((i * 37) % 40) - 20, scale: 0.85 }
            }
            key={i}
            transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 120, damping: 16 }}
          >
            <PhotoImg photo={photo} />
          </motion.li>
        ))}
      </ul>
    </HeroFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Diagonal rows                                                       */

function DiagonalRow({ photos, progress, direction }: { photos: Photo[]; progress: MotionValue<number>; direction: 1 | -1 }) {
  const x = useTransform(progress, [0, 1], direction > 0 ? [-320, 60] : [0, -380]);
  return (
    <motion.div className="flex gap-3 will-change-transform" style={{ x }}>
      {photos.map((photo, i) => (
        <div className="aspect-[4/3] w-40 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-48" key={i}>
          <PhotoImg photo={photo} />
        </div>
      ))}
    </motion.div>
  );
}

/** Slanted rows of photos sliding opposite ways behind a clean panel with the name. */
export function HeroDiagonalHome({ bgPattern: _bgPattern, slides, ...copy }: PhotoHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const progress = useHeroProgress(ref);
  const photos = heroPhotos(slides, 12);
  const rows = [0, 1, 2, 3].map((r) => Array.from({ length: 10 }, (_, k) => photos[(r * 3 + k) % photos.length]));

  return (
    <div className="relative">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <FullWidthDivider position="bottom" />
      <section className="relative h-[27rem] overflow-hidden sm:h-[30rem]" ref={ref}>
        <div aria-hidden className="absolute -inset-x-48 -inset-y-28 flex -rotate-12 flex-col justify-center gap-3">
          {rows.map((row, r) => (
            <DiagonalRow direction={r % 2 ? -1 : 1} key={r} photos={row} progress={progress} />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center p-4 sm:p-8">
          <HeroCopy {...copy} className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl sm:p-8" />
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Accordion panels                                                    */

function AccordionPanel({
  photo,
  index,
  active,
  onPick,
}: {
  photo: Photo;
  index: number;
  active: MotionValue<number>;
  onPick: (index: number | null) => void;
}) {
  const flexGrow = useTransform(active, (v) => 1 + 4 * Math.max(0, 1 - Math.abs(index - v)));
  const captionOpacity = useTransform(active, (v) => Math.max(0, 1 - Math.abs(index - v) * 1.5));
  return (
    <motion.button
      aria-label={photo.title || `Photo ${index + 1}`}
      className="relative min-w-0 basis-0 overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onPick(index)}
      onFocus={() => onPick(index)}
      onMouseEnter={() => onPick(index)}
      style={{ flexGrow }}
      type="button"
    >
      <PhotoImg photo={photo} sizes="(max-width: 640px) 90vw, 800px" />
      {photo.title ? (
        <motion.span
          className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/65 to-transparent px-3 pt-8 pb-2.5 text-left text-xs font-medium text-white"
          style={{ opacity: captionOpacity }}
        >
          {photo.title}
        </motion.span>
      ) : null}
    </motion.button>
  );
}

/** Tall photo strips side by side; one opens wide at a time — in turn as you
 * scroll, or the one you point at or tap. */
export function HeroAccordionHome({ bgPattern, slides, ...copy }: PhotoHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photos = heroPhotos(slides, 5).slice(0, 5);
  const last = photos.length - 1;
  const target = useMotionValue(0);
  const active = useSpring(target, { stiffness: 170, damping: 26 });
  const [picked, setPicked] = useState<number | null>(null);

  const fromScroll = (v: number) => Math.min(last, Math.max(0, v * 2 * last));
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (picked === null) target.set(fromScroll(v));
  });
  const pick = (index: number | null) => {
    setPicked(index);
    target.set(index ?? fromScroll(scrollYProgress.get()));
  };

  return (
    <div className="relative">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <FullWidthDivider position="bottom" />
      <section className="relative isolate overflow-hidden pb-8 sm:pb-10" ref={ref}>
        <HeroPattern pattern={bgPattern} />
        <HeroCopy {...copy} className={copyPadding} />
        <div className="mt-8 flex h-64 gap-2 px-4 sm:h-80 sm:px-6 md:h-96" onMouseLeave={() => pick(null)}>
          {photos.map((photo, i) => (
            <AccordionPanel active={active} index={i} key={i} onPick={pick} photo={photo} />
          ))}
        </div>
      </section>
    </div>
  );
}
