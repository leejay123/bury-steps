"use client";

import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ago, initials } from "@/components/stories/story-viewer";
import type { StoryViewerEntry, StoryViewers } from "@/app/api/stories/[id]/viewers/route";

/** null while loading; "error" if the list couldn't be fetched. */
export type ViewersState = StoryViewerEntry[] | "error" | null;

async function fetchViewers(storyId: string): Promise<ViewersState> {
  const res = await fetch(`/api/stories/${encodeURIComponent(storyId)}/viewers`, {
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return "error";
  return ((await res.json()) as StoryViewers).viewers;
}

/**
 * Who has viewed your story on screen. Fetched when it comes up, and again
 * when the list is opened so it's up to date. Nothing for other people's.
 */
export function useStoryViewers(storyId: string | undefined, listOpen: boolean): ViewersState {
  const [got, setGot] = useState<{ id: string; viewers: ViewersState } | null>(null);
  useEffect(() => {
    if (!storyId) return;
    let alive = true;
    fetchViewers(storyId).then((viewers) => {
      if (alive) setGot({ id: storyId, viewers });
    });
    return () => {
      alive = false;
    };
  }, [storyId, listOpen]);
  return got && got.id === storyId ? got.viewers : null;
}

export function ViewedByButton({
  viewers,
  onClick,
}: {
  viewers: ViewersState;
  onClick: () => void;
}) {
  return (
    <button
      className="flex cursor-pointer items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white"
      onClick={onClick}
      type="button"
    >
      <Eye className="size-3.5" /> Viewed by
      {viewers === null ? (
        <Skeleton className="h-3 w-3 rounded-sm bg-white/30" />
      ) : viewers === "error" ? null : (
        ` ${viewers.length}`
      )}
    </button>
  );
}

/** The list, as a sheet over the bottom of the story. */
export function ViewedByPanel({
  viewers,
  onClose,
}: {
  viewers: ViewersState;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-end justify-center">
      <button
        aria-label="Close the list"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <section
        aria-label="Viewed by"
        className="relative flex max-h-[60%] w-full flex-col rounded-t-xl bg-background text-foreground sm:max-w-[calc(100dvh*9/16)]"
      >
        <div className="flex items-center justify-between border-b py-2 pr-2 pl-4">
          <h2 className="text-sm font-semibold">
            Viewed by{Array.isArray(viewers) ? ` ${viewers.length}` : ""}
          </h2>
          <Button
            aria-label="Close the list"
            autoFocus
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        </div>
        {/* Its own scrolling: the story behind doesn't take swipes. */}
        <div className="touch-pan-y overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
          {viewers === null ? (
            <div aria-hidden className="flex items-center gap-3 py-2">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="ml-auto h-3 w-6" />
            </div>
          ) : viewers === "error" ? (
            <p className="py-3 text-sm text-muted-foreground">
              The list couldn&apos;t load. Close it and try again.
            </p>
          ) : viewers.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">No one has viewed this yet.</p>
          ) : (
            <ul>
              {viewers.map((viewer) => (
                <li className="flex items-center gap-3 py-2" key={viewer.id}>
                  <Avatar className="size-9">
                    {viewer.imageUrl ? <AvatarImage alt="" src={viewer.imageUrl} /> : null}
                    <AvatarFallback className="text-xs">{initials(viewer.name)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">{viewer.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {ago(viewer.viewedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
