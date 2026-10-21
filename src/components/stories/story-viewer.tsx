"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { StoryFeedPerson } from "@/app/api/stories/route";

export type StoryPosition = { user: number; story: number };

/** How far down a swipe has to go to close the viewer. */
const SWIPE_CLOSE_PX = 90;
/** How far sideways a swipe has to go to change person. */
const SWIPE_PERSON_PX = 50;
/** A press shorter than this (that barely moved) is a tap; longer is a hold. */
const TAP_MS = 250;

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function ago(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

/**
 * Full-screen story viewer. The current story's bar is a CSS animation (the
 * `story-fill` class in globals.css), so it runs smoothly off the main thread
 * and the next story only comes up once the bar has actually filled.
 * Tap the left third to go back and the rest to go forward; hold to pause;
 * swipe sideways for the next or previous person; swipe down to close.
 */
export function StoryViewer({
  people,
  start,
  paused = false,
  onClose,
  onChange,
  children,
}: {
  people: StoryFeedPerson[];
  start: StoryPosition;
  /** Paused from outside, e.g. while "Tap again to delete" is showing. */
  paused?: boolean;
  onClose: () => void;
  onChange: (position: StoryPosition) => void;
  /** Extra buttons along the bottom (report, delete). */
  children?: React.ReactNode;
}) {
  const [pos, setPos] = useState(start);
  // Bumped to restart the current story (going back from a person's first).
  const [run, setRun] = useState(0);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [hidden, setHidden] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const press = useRef<{
    x: number;
    y: number;
    at: number;
    id: number;
  } | null>(null);

  const person = people[pos.user];
  const story = person?.stories[pos.story];

  useEffect(() => {
    onChange(pos);
  }, [pos, onChange]);

  const nextPerson = useCallback(() => {
    if (pos.user < people.length - 1) setPos({ user: pos.user + 1, story: 0 });
    else onClose();
  }, [pos, people.length, onClose]);

  const previousPerson = useCallback(() => {
    if (pos.user > 0) setPos({ user: pos.user - 1, story: 0 });
    else setRun((r) => r + 1);
  }, [pos]);

  const next = useCallback(() => {
    const stories = people[pos.user]?.stories.length ?? 0;
    if (pos.story < stories - 1) setPos({ user: pos.user, story: pos.story + 1 });
    else nextPerson();
  }, [pos, people, nextPerson]);

  const previous = useCallback(() => {
    if (pos.story > 0) setPos({ user: pos.user, story: pos.story - 1 });
    else previousPerson();
  }, [pos, previousPerson]);

  // The page underneath stays put; the tab being hidden pauses the story.
  useEffect(() => {
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      root.style.overflow = overflow;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") previous();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, next, previous]);

  if (!person || !story) return null;

  const loaded = loadedId === story.id;
  const running = loaded && !holding && !hidden && !paused;

  function slide(dy: number) {
    const el = contentRef.current;
    if (!el) return;
    el.style.transition = dy ? "none" : "";
    el.style.transform = dy ? `translateY(${dy}px)` : "";
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    press.current = {
      x: event.clientX,
      y: event.clientY,
      at: event.timeStamp,
      id: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setHolding(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const start = press.current;
    if (!start || start.id !== event.pointerId) return;
    const dy = event.clientY - start.y;
    if (dy > 0 && dy > Math.abs(event.clientX - start.x)) slide(dy);
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const start = press.current;
    press.current = null;
    setHolding(false);
    slide(0);
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (dy > SWIPE_CLOSE_PX && dy > Math.abs(dx)) return onClose();
    if (Math.abs(dx) > SWIPE_PERSON_PX && Math.abs(dx) > Math.abs(dy))
      return dx < 0 ? nextPerson() : previousPerson();
    if (event.timeStamp - start.at > TAP_MS || Math.hypot(dx, dy) > 10) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX - box.left < box.width / 3) previous();
    else next();
  }

  function onPointerCancel() {
    press.current = null;
    setHolding(false);
    slide(0);
  }

  return createPortal(
    <div
      aria-label={`Stories by ${person.isMe ? "you" : person.name}`}
      aria-modal="true"
      className="fixed inset-0 z-[10000] flex touch-none justify-center overscroll-contain bg-black outline-none select-none"
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <div
        className="relative h-full w-full transition-transform duration-200 sm:max-w-[calc(100dvh*9/16)]"
        onPointerCancel={onPointerCancel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        ref={contentRef}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- signed one-hour link, already downloaded */}
        <img
          alt=""
          className="absolute inset-0 size-full object-cover"
          draggable={false}
          key={story.id}
          onError={() => setLoadedId(story.id)}
          onLoad={() => setLoadedId(story.id)}
          ref={(img) => {
            if (img?.complete && img.naturalWidth > 0 && loadedId !== story.id)
              setLoadedId(story.id);
          }}
          src={story.src}
        />

        <div className="absolute inset-x-0 top-0 flex flex-col gap-3 bg-gradient-to-b from-black/60 to-transparent px-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-8">
          <div className="flex gap-1">
            {person.stories.map((item, index) => (
              <div
                className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35"
                key={item.id}
              >
                {index < pos.story ? (
                  <div className="h-full w-full bg-white" />
                ) : index === pos.story ? (
                  <div
                    className="story-fill h-full w-full bg-white"
                    key={`${item.id}:${run}`}
                    onAnimationEnd={(event) => {
                      if (event.target === event.currentTarget) next();
                    }}
                    style={{
                      animationPlayState: running ? "running" : "paused",
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-white">
            <Avatar className="size-8">
              {person.imageUrl ? (
                <AvatarImage alt="" src={person.imageUrl} />
              ) : null}
              <AvatarFallback className="text-xs text-foreground">
                {initials(person.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-semibold">
              {person.isMe ? "Your story" : person.name}
            </span>
            <span className="shrink-0 text-sm text-white/70">
              {ago(story.createdAt)}
            </span>
            <Button
              aria-label="Close stories"
              className="ml-auto rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
              onClick={onClose}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {loaded ? null : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}

        {children ? (
          <div className="absolute inset-x-0 bottom-[max(env(safe-area-inset-bottom),1.5rem)] flex justify-center gap-2">
            {children}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
