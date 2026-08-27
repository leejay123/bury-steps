"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { GripVertical } from "lucide-react";
import { restorePagePointerEvents } from "@/components/overlay-root";

export function DragHandle({
  label,
  ...props
}: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground active:cursor-grabbing"
      data-drag-handle
      type="button"
      {...props}
    >
      <GripVertical />
    </button>
  );
}

function hitSortableId(listId: string, clientY: number): string | null {
  const nodes = document.querySelectorAll<HTMLElement>(
    `[data-sortable-list="${CSS.escape(listId)}"][data-sortable-id]`,
  );
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (clientY >= rect.top && clientY <= rect.bottom) {
      return node.getAttribute("data-sortable-id");
    }
  }
  return null;
}

export function useSortableIds(listId: string, ids: string[], onReorder: (ids: string[]) => void) {
  const [order, setOrder] = useState(ids);
  const orderRef = useRef(ids);
  const dragId = useRef<string | null>(null);
  const didDrag = useRef(false);
  const startY = useRef(0);
  const skipClick = useRef(false);
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  useEffect(() => {
    setOrder(ids);
    orderRef.current = ids;
  }, [ids]);

  useEffect(() => {
    function move(overId: string) {
      const fromId = dragId.current;
      if (!fromId || fromId === overId) return;
      const current = orderRef.current;
      const from = current.indexOf(fromId);
      const to = current.indexOf(overId);
      if (from < 0 || to < 0) return;
      const next = [...current];
      next.splice(from, 1);
      next.splice(to, 0, fromId);
      orderRef.current = next;
      setOrder(next);
      didDrag.current = true;
    }

    function endDrag() {
      if (!dragId.current) return;
      const moved = didDrag.current;
      dragId.current = null;
      didDrag.current = false;
      restorePagePointerEvents();
      if (moved) {
        skipClick.current = true;
        onReorderRef.current(orderRef.current);
      }
    }

    function onMove(event: PointerEvent) {
      if (!dragId.current) return;
      if (!didDrag.current && Math.abs(event.clientY - startY.current) < 8) return;
      didDrag.current = true;
      const overId = hitSortableId(listId, event.clientY);
      if (overId) move(overId);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      dragId.current = null;
      restorePagePointerEvents();
    };
  }, [listId]);

  return {
    order,
    rowProps(id: string) {
      return {
        "data-sortable-id": id,
        "data-sortable-list": listId,
        onClickCapture(event: MouseEvent) {
          if (!skipClick.current) return;
          event.preventDefault();
          event.stopPropagation();
          skipClick.current = false;
        },
      };
    },
    handleProps(id: string) {
      return {
        onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
          if (event.button !== 0) return;
          event.stopPropagation();
          event.currentTarget.setPointerCapture(event.pointerId);
          dragId.current = id;
          startY.current = event.clientY;
          didDrag.current = false;
        },
      };
    },
  };
}
