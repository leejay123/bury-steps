"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        className="size-7 rounded-b-none"
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
        className="size-7 rounded-t-none"
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

export function useReorderableIds(ids: string[], onReorder: (ids: string[]) => void) {
  const [order, setOrder] = useState(ids);

  useEffect(() => {
    setOrder(ids);
  }, [ids]);

  function move(id: string, direction: -1 | 1) {
    const from = order.indexOf(id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
    onReorder(next);
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
