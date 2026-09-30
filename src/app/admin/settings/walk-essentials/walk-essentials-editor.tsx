"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { updateWalkEssentials, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import {
  DEFAULT_WALK_ESSENTIALS,
  ESSENTIAL_ICONS,
  MAX_WALK_ESSENTIALS,
  MAX_WALK_ESSENTIAL_LABEL,
  essentialIcon,
  type EssentialItem,
} from "@/lib/walk-essentials";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SettingsSection } from "../settings-page";

/** A fresh key for an item someone adds — never reused, so an old walk's
 * tick can't land on a different, newer item. */
const newKey = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * Rename, re-icon, reorder, add and remove the Essentials tick boxes.
 * Edits stay on this page until Save, so a half-typed name never shows on
 * a walk.
 */
export function WalkEssentialsEditor({ items: saved }: { items: EssentialItem[] }) {
  const [items, setItems] = useState(saved);
  useResetOnChange([saved], () => setItems(saved));
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updateWalkEssentials, null);
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
              const Icon = essentialIcon(item.icon);
              return (
                <li className="flex flex-wrap items-center gap-2 rounded-lg border p-2 sm:flex-nowrap" key={item.key}>
                  <Select onValueChange={(icon) => update(index, { icon })} value={item.icon}>
                    <SelectTrigger aria-label={`Icon for ${item.label || "this item"}`} className="w-auto shrink-0">
                      <Icon aria-hidden className="size-4" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ESSENTIAL_ICONS).map(([name, option]) => (
                        <SelectItem key={name} value={name}>
                          <span className="flex items-center gap-2">
                            <option.icon aria-hidden className="size-4" />
                            {option.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    aria-label="Name"
                    className="min-w-0 flex-1"
                    maxLength={MAX_WALK_ESSENTIAL_LABEL}
                    onChange={(event) => update(index, { label: event.target.value })}
                    placeholder="e.g. Toilets available"
                    value={item.label}
                  />
                  <div className="flex shrink-0 gap-1">
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
            <Button onClick={() => setItems(saved)} size="sm" type="button" variant="outline">
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
