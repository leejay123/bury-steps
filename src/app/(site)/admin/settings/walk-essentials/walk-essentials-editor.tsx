"use client";

import { createElement, useEffect, useState } from "react";
import { libraryIconNames } from "@/components/library-icon";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Search, Trash2 } from "lucide-react";
import { updateWalkEssentials } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import {
  DEFAULT_WALK_ESSENTIALS,
  ESSENTIAL_ICONS,
  LIBRARY_ICON_PREFIX,
  essentialIcon,
  MAX_WALK_ESSENTIALS,
  MAX_WALK_ESSENTIAL_LABEL,
  type EssentialItem,
} from "@/lib/walk-essentials";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SettingsSection } from "../settings-page";

/** A fresh key for an item someone adds — never reused, so an old walk's
 * tick can't land on a different, newer item. */
const newKey = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Every icon as a labelled tile in a searchable grid — easier to scan
 * than a narrow list, and you see the icon you're picking. */
export function IconPicker({ label, onChange, value }: { label: string; onChange: (icon: string) => void; value: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // The whole free library's names, loaded the first time the picker opens.
  const [libraryNames, setLibraryNames] = useState<string[] | null>(null);
  useEffect(() => {
    if (!open || libraryNames) return;
    let live = true;
    libraryIconNames()
      .then((names) => {
        if (live) setLibraryNames(names);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [open, libraryNames]);
  const q = query.trim().toLowerCase();
  const options = Object.entries(ESSENTIAL_ICONS).filter(
    ([name, option]) => !q || option.label.toLowerCase().includes(q) || name.includes(q),
  );
  // Typing searches every library icon too (by its English name, e.g.
  // "tree" finds tree-pine), the first 60 matches.
  const words = q.replace(/\s+/g, "-");
  const more =
    words.length >= 2 && libraryNames
      ? libraryNames.filter((name) => name.includes(words)).slice(0, 60)
      : [];
  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <Popover
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <Button aria-label={`Icon for ${label || "this item"}`} className="shrink-0 gap-1.5" type="button" variant="outline">
          {createElement(essentialIcon(value), { "aria-hidden": true, className: "size-4" })}
          <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 p-3">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search icons"
            className="pl-8"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search icons…"
            value={query}
          />
        </div>
        <div className="grid max-h-72 grid-cols-4 gap-1 overflow-y-auto overscroll-contain">
          {options.map(([name, option]) => (
            <button
              aria-pressed={name === value}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md px-1 py-2 text-center text-[11px] leading-tight text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                name === value && "bg-muted text-foreground ring-1 ring-foreground/30",
              )}
              key={name}
              onClick={() => pick(name)}
              type="button"
            >
              <option.icon aria-hidden className="size-5" />
              <span className="line-clamp-2">{option.label}</span>
            </button>
          ))}
          {more.length > 0 ? (
            <p className="col-span-4 pt-2 text-xs font-medium text-muted-foreground">More free icons</p>
          ) : null}
          {more.map((name) => {
            const saved = `${LIBRARY_ICON_PREFIX}${name}`;
            return (
              <button
                aria-pressed={saved === value}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md px-1 py-2 text-center text-[11px] leading-tight text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  saved === value && "bg-muted text-foreground ring-1 ring-foreground/30",
                )}
                key={saved}
                onClick={() => pick(saved)}
                type="button"
              >
                {createElement(essentialIcon(saved), { "aria-hidden": true, className: "size-5" })}
                <span className="line-clamp-2 break-all">{name.replaceAll("-", " ")}</span>
              </button>
            );
          })}
          {options.length === 0 && more.length === 0 ? (
            <p className="col-span-4 py-4 text-center text-sm text-muted-foreground">
              {words.length >= 2 && !libraryNames ? "Searching…" : "No icons match."}
            </p>
          ) : null}
          {!q ? (
            <p className="col-span-4 pt-2 text-center text-xs text-muted-foreground">
              Type to search over 1,500 more free icons.
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Rename, re-icon, reorder, add and remove the Essentials tick boxes.
 * Edits stay on this page until Save, so a half-typed name never shows on
 * a walk.
 */
export function WalkEssentialsEditor({ items: saved }: { items: EssentialItem[] }) {
  const [items, setItems] = useState(saved);
  useResetOnChange([saved], () => setItems(saved));
  const [state, action, pending, clearError] = useSafeActionState(updateWalkEssentials);
  useActionToast(state);

  const dirty = JSON.stringify(items) !== JSON.stringify(saved);
  const update = (index: number, change: Partial<EssentialItem>) =>
    setItems((list) => list.map((item, i) => (i === index ? { ...item, ...change } : item)));
  const move = (index: number, by: -1 | 1) =>
    setItems((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      return next;
    });

  return (
    <SettingsSection
      description="Each item is a tick box on the walk form, and ticked ones show as small labels on the walk's page."
      title="Essentials list"
    >
      <form action={action} className="flex flex-col gap-4">
        <input name="items" type="hidden" value={JSON.stringify(items)} />
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No essentials. Add one below, or walks won&apos;t show an Essentials list.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item, index) => {
              return (
                <li className="flex flex-wrap items-center gap-2 rounded-lg border p-2 sm:flex-nowrap" key={item.key}>
                  <IconPicker
                    label={item.label}
                    onChange={(icon) => update(index, { icon })}
                    value={item.icon}
                  />
                  {/* At least 12rem, so on a phone the arrows and Remove wrap
                      onto their own line instead of squeezing the name. */}
                  <Input
                    aria-label="Name"
                    className="min-w-[12rem] flex-1"
                    maxLength={MAX_WALK_ESSENTIAL_LABEL}
                    onChange={(event) => update(index, { label: event.target.value })}
                    placeholder="e.g. Toilets available"
                    value={item.label}
                  />
                  <div className="ml-auto flex shrink-0 gap-1">
                    <Button
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      aria-label="Move down"
                      disabled={index === items.length - 1}
                      onClick={() => move(index, 1)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      aria-label={`Remove ${item.label || "this item"}`}
                      onClick={() => setItems((list) => list.filter((_, i) => i !== index))}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div>
          <Button
            disabled={items.length >= MAX_WALK_ESSENTIALS}
            onClick={() => setItems((list) => [...list, { key: newKey(), label: "", icon: "info" }])}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus data-icon="inline-start" />
            Add an essential
          </Button>
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button disabled={!dirty || pending} size="sm" type="submit">
            {pending ? "Saving…" : "Save"}
          </Button>
          {dirty ? (
            <Button
              onClick={() => {
                setItems(saved);
                clearError();
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              Discard
            </Button>
          ) : null}
          <Button
            className="ml-auto"
            onClick={() => setItems(DEFAULT_WALK_ESSENTIALS)}
            size="sm"
            type="button"
            variant="ghost"
          >
            Back to the original list
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}
