"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Flag, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StoryViewer, type User as ViewerUser } from "react-instagram-stories";
import "react-instagram-stories/styles.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteStory, postStory, reportStory } from "@/server/actions/stories";
import type { StoryFeed } from "@/app/api/stories/route";

const SEEN_KEY = "bs-seen-stories";
const MAX_LIVE = 10;

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

/** A plain grey circle with initials, for the viewer's header when there's no photo. */
function initialsAvatar(name: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#e4e4e7"/><text x="32" y="38" font-family="system-ui,sans-serif" font-size="22" font-weight="600" fill="#3f3f46" text-anchor="middle">${initials(name)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function fetchFeed(): Promise<StoryFeed | null> {
  const res = await fetch("/api/stories", { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return null;
  return (await res.json()) as StoryFeed;
}

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}
function saveSeen(seen: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-500)));
  } catch {
    /* private mode: rings just show again */
  }
}

/**
 * Shrinks a photo on the phone before it's sent: at most 1440px on its long
 * side, as a JPEG of under ~900 KB, so stories load fast and storage stays small.
 */
async function shrinkPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 1440 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.82, 0.72, 0.62, 0.5]) {
    const blob = await new Promise<Blob | null>((done) =>
      canvas.toBlob(done, "image/jpeg", quality),
    );
    if (blob && (blob.size <= 900_000 || quality === 0.5)) return blob;
  }
  throw new Error("That photo couldn't be read.");
}

/**
 * Stories on the Walks page: a row of round photos (a ring on anyone with a
 * story you haven't seen), "+" to add yours, and the full-screen viewer.
 * Signed-in people only: the list comes from /api/stories, which turns
 * signed-out visitors away, so for them nothing shows.
 */
export function StoriesRow() {
  const [feed, setFeed] = useState<StoryFeed | null>(null);
  // Signed out (or the list couldn't load): the row isn't shown at all.
  const [off, setOff] = useState(false);
  // Read once on the browser (the row draws nothing until stories load).
  const [seen, setSeen] = useState<Set<string>>(() =>
    typeof window === "undefined" ? new Set() : readSeen(),
  );
  const [open, setOpen] = useState<{ user: number; story: number } | null>(null);
  const [current, setCurrent] = useState<{ user: number; story: number }>({ user: 0, story: 0 });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, startUpload] = useTransition();
  const [busy, startBusy] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  // Bumped after posting or deleting, to fetch the list again.
  const [version, setVersion] = useState(0);
  const load = useCallback(async () => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    fetchFeed().then((next) => {
      if (!alive) return;
      if (next) setFeed(next);
      else setOff(true);
    });
    return () => {
      alive = false;
    };
  }, [version]);

  const markSeen = useCallback((id: string | undefined) => {
    if (!id) return;
    setSeen((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      saveSeen(next);
      return next;
    });
  }, []);

  if (off) return null;
  // Grey circles while it loads, so the list under it doesn't jump down.
  if (!feed)
    return (
      <div aria-hidden className="flex gap-4 overflow-hidden py-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div className="flex w-16 shrink-0 flex-col items-center gap-1.5" key={i}>
            <Skeleton className="size-14 rounded-full" />
            <Skeleton className="h-3 w-12 rounded-lg" />
          </div>
        ))}
      </div>
    );
  if (!feed.configured || !feed.me) return null;
  const people = feed.people;
  const mine = people.find((person) => person.isMe);
  const canAdd = (mine?.stories.length ?? 0) < MAX_LIVE;

  const users: ViewerUser[] = people.map((person) => ({
    id: person.id,
    username: person.isMe ? "Your story" : person.name,
    avatarUrl: person.imageUrl ?? initialsAvatar(person.name),
    hasUnreadStories: person.stories.some((story) => !seen.has(story.id)),
    stories: person.stories.map((story) => ({ id: story.id, type: "image" as const, src: story.src })),
  }));
  const shown = open ? people[current.user]?.stories[current.story] : undefined;

  function openPerson(index: number) {
    const firstUnseen = people[index].stories.findIndex((story) => !seen.has(story.id));
    const story = firstUnseen === -1 ? 0 : firstUnseen;
    setCurrent({ user: index, story });
    setOpen({ user: index, story });
    setConfirmDelete(false);
    markSeen(people[index].stories[story]?.id);
  }

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    startUpload(async () => {
      try {
        const photo = await shrinkPhoto(file);
        const form = new FormData();
        form.set("photo", new File([photo], "story.jpg", { type: "image/jpeg" }));
        const result = await postStory(null, form);
        if (result.ok) {
          toast.success(result.message ?? "Added to your story.");
          await load();
        } else toast.error(result.error);
      } catch {
        toast.error("That photo couldn't be added. Try another one.");
      }
    });
  }

  function onDelete() {
    if (!shown) return;
    if (!confirmDelete) return setConfirmDelete(true);
    startBusy(async () => {
      const result = await deleteStory({ id: shown.id });
      if (result.ok) {
        toast.success(result.message ?? "Story deleted.");
        setOpen(null);
        await load();
      } else toast.error(result.error);
    });
  }

  function onReport() {
    if (!shown) return;
    startBusy(async () => {
      const result = await reportStory({ id: shown.id });
      if (result.ok) toast.success(result.message ?? "Reported.");
      else toast.error(result.error);
    });
  }

  return (
    <section aria-label="Stories" className="flex flex-col gap-2">
      {/* Room around the circles, or the scrolling row clips their rings. */}
      <div className="-mx-1.5 flex gap-4 overflow-x-auto px-1.5 py-1.5">
        {canAdd ? (
          <button
            className="flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1.5 text-center"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            <span className="relative">
              <Avatar className="size-14 border">
                {feed.me.imageUrl ? <AvatarImage alt="" src={feed.me.imageUrl} /> : null}
                <AvatarFallback>{initials(feed.me.name)}</AvatarFallback>
              </Avatar>
              <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full border-2 border-background bg-foreground text-background">
                {uploading ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
              </span>
            </span>
            <span className="w-full truncate text-xs text-muted-foreground">
              {uploading ? "Adding…" : "Add story"}
            </span>
          </button>
        ) : null}
        {people.map((person, index) => {
          const unseen = person.stories.some((story) => !seen.has(story.id));
          const reported = person.stories.some((story) => story.reports > 0);
          return (
            <button
              className="flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1.5 text-center"
              key={person.id}
              onClick={() => openPerson(index)}
              type="button"
            >
              <span
                className={cn(
                  "rounded-full p-0.5",
                  unseen ? "ring-2 ring-foreground" : "ring-1 ring-border",
                )}
              >
                {/* Their first story's photo (like Instagram), not their profile photo. */}
                <Avatar className="size-13 border-2 border-background">
                  <AvatarImage
                    alt=""
                    className="object-cover"
                    src={person.stories[0]?.src ?? person.imageUrl ?? undefined}
                  />
                  <AvatarFallback>{initials(person.name)}</AvatarFallback>
                </Avatar>
              </span>
              <span className="w-full truncate text-xs">
                {person.isMe ? "Your story" : person.name.split(" ")[0]}
              </span>
              {reported ? (
                <span className="-mt-1 text-[10px] font-medium text-muted-foreground">Reported</span>
              ) : null}
            </button>
          );
        })}
        <input accept="image/*" className="hidden" onChange={onPick} ref={fileRef} type="file" />
      </div>

      {open ? (
        <>
          <StoryViewer
            initialStoryIndex={open.story}
            initialUserIndex={open.user}
            isOpen
            onClose={() => setOpen(null)}
            onStoryChange={(user, story) => {
              setCurrent({ user, story });
              setConfirmDelete(false);
              markSeen(people[user]?.stories[story]?.id);
            }}
            users={users}
          />
          {/* Our own buttons over the viewer (it has no slot for them). */}
          {shown && (shown.canDelete || shown.canReport) ? (
            <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[10000] flex justify-center gap-2">
              {shown.reports > 0 ? (
                <span className="pointer-events-auto rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
                  Reported by {shown.reports}
                </span>
              ) : null}
              {shown.canReport ? (
                <button
                  className="pointer-events-auto flex cursor-pointer items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white"
                  disabled={busy}
                  onClick={onReport}
                  type="button"
                >
                  <Flag className="size-3.5" /> Report
                </button>
              ) : null}
              {shown.canDelete ? (
                <button
                  className="pointer-events-auto flex cursor-pointer items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white"
                  disabled={busy}
                  onClick={onDelete}
                  type="button"
                >
                  <Trash2 className="size-3.5" /> {confirmDelete ? "Tap again to delete" : "Delete"}
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
