"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { actionErrorMessage } from "@/lib/action-errors";
import type { ActionResult } from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";

export function ReorderButtons({
  canMoveDown,
  canMoveUp,
  className,
  label,
  onMoveDown,
  onMoveUp,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  className?: string;
  label: string;
  onMoveDown: () => void;
  onMoveUp: () => void;
}) {
  return (
    <div
      className={cn("flex shrink-0 flex-col", className)}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Button
        aria-label={`Move ${label} up`}
        className="size-11 rounded-b-none"
        disabled={!canMoveUp}
        onClick={onMoveUp}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ChevronUp className="size-4" />
      </Button>
      <Button
        aria-label={`Move ${label} down`}
        className="size-11 rounded-t-none"
        disabled={!canMoveDown}
        onClick={onMoveDown}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ChevronDown className="size-4" />
      </Button>
    </div>
  );
}

export function useReorderableIds(
  ids: string[],
  onReorder: (ids: string[]) => Promise<ActionResult> | ActionResult | void,
) {
  const [order, setOrder] = useState(ids);
  // `ids` is a fresh array on every render (callers build it with `.map`), so
  // comparing by reference in the effect below would fire on every render
  // and never settle — an infinite render loop. Compare by value instead.
  const key = ids.join("\u0000");

  useResetOnChange([key], () => setOrder(ids));

  function move(id: string, direction: -1 | 1) {
    const from = order.indexOf(id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= order.length) return;
    const previous = order;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    // Optimistic — flips immediately so the arrows feel instant. If the
    // save fails, put the list back the way it was and say so, rather than
    // leave the screen showing an order the database never actually saved.
    setOrder(next);
    Promise.resolve(onReorder(next))
      .then((result) => {
        if (result && !result.ok) {
          setOrder(previous);
          toast.error(result.error);
        }
      })
      .catch((err) => {
        setOrder(previous);
        toast.error(actionErrorMessage(err, "Could not save that order. Try again."));
      });
  }

  return {
    order,
    moveDown(id: string) {
      move(id, 1);
    },
    moveUp(id: string) {
      move(id, -1);
    },
  };
}
