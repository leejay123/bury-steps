"use client";

import { useRef, useState } from "react";
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
import { JoinGroupButton } from "@/components/join-group-button";
import { SAMPLE_WALK_PHOTOS } from "@/lib/sample-walk-photos";
import type { SlideView } from "@/lib/slides";
import { cn } from "@/lib/utils";

/**
 * Five photo heroes (Settings → Homepage layout → Hero style), picked from
 * the Parallax design options: Drifting columns, Sideways strip, Tiles fall
 * into place, Diagonal rows and Accordion panels. All use the Hero photos,
 * topped up with sample walking photos, and keep the name and buttons close
 * to the pictures — no tall empty stretches. Scroll effects run while the
 * hero scrolls away, so nothing has to be pinned in place.
 */

export type PhotoHeroProps = {
  slides: SlideView[];
  isSignedIn: boolean;
  signInHref: string;
  signUpHref: string;
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

function PhotoImg({ photo, className }: { photo: Photo; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" className={cn("size-full object-cover", className)} decoding="async" loading="lazy" src={photo.src} />
  );
}

function HeroCopy({
  isSignedIn,
  signInHref,
  signUpHref,
  siteName,
  siteTagline,
  className,
}: Omit<PhotoHeroProps, "slides"> & { className?: string }) {
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
          <>
            <JoinGroupButton href={signUpHref} />
            <Button asChild size="sm" variant="outline">
              <a href={signInHref}>Sign in</a>
            </Button>
          </>
        )}
      </div>
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
      <section className={cn("relative overflow-hidden", className)}>{children}</section>
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
/* Drifting columns                                                    */

function DriftColumn({
  photos,
  progress,
  start,
  speed,
  className,
}: {
  photos: Photo[];
  progress: MotionValue<number>;
  start: number;
  speed: number;
  className?: string;
}) {
  const y = useTransform(progress, [0, 1], [start, start - speed * 320]);
  return (
    <motion.div className={cn("flex flex-col gap-3 will-change-transform", className)} style={{ y }}>
      {photos.map((photo, i) => (
        <div className="aspect-[3/4] shrink-0 overflow-hidden rounded-xl bg-muted" key={i}>
          <PhotoImg photo={photo} />
        </div>
      ))}
    </motion.div>
  );
}

/** A wall of photo columns drifting up at different speeds behind a frosted panel. */
export function HeroColumnsHome({ slides, ...copy }: PhotoHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const progress = useHeroProgress(ref);
  const photos = heroPhotos(slides, 16);
  const columns = [0, 1, 2, 3].map((c) => [0, 1, 2, 3, 4].map((k) => photos[(c * 4 + k) % photos.length]));
  const starts = [-40, -170, -90, -130];
  const speeds = [0.55, 1, 0.7, 0.9];

  return (
    <div className="relative">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <FullWidthDivider position="bottom" />
      <section className="relative h-[27rem] overflow-hidden sm:h-[31rem]" ref={ref}>
        <div aria-hidden className="absolute inset-x-0 top-0 grid grid-cols-3 gap-3 px-3 md:grid-cols-4">
          {columns.map((column, c) => (
            <DriftColumn
              className={c === 3 ? "hidden md:flex" : undefined}
              key={c}
              photos={column}
              progress={progress}
              speed={speeds[c]}
              start={starts[c]}
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <HeroCopy
            {...copy}
            className="w-full max-w-md rounded-2xl border bg-background/80 p-6 shadow-lg backdrop-blur-md sm:p-8"
          />
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sideways strip                                                      */

/** The name and buttons above one row of tall photos that slides sideways as you scroll. */
export function HeroStripHome({ slides, ...copy }: PhotoHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const progress = useHeroProgress(ref);
  const x = useTransform(progress, [0, 1], ["0%", "-32%"]);
  const photos = heroPhotos(slides, 10);

  return (
    <div className="relative">
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />
      <FullWidthDivider position="bottom" />
      <section className="relative overflow-hidden pb-8 sm:pb-10" ref={ref}>
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
export function HeroTilesHome({ slides, ...copy }: PhotoHeroProps) {
  const reduce = useReducedMotion();
  const photos = heroPhotos(slides, 8).slice(0, 8);

  return (
    <HeroFrame className="pb-8 sm:pb-10">
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
export function HeroDiagonalHome({ slides, ...copy }: PhotoHeroProps) {
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
      <PhotoImg photo={photo} />
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
export function HeroAccordionHome({ slides, ...copy }: PhotoHeroProps) {
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
      <section className="relative overflow-hidden pb-8 sm:pb-10" ref={ref}>
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
