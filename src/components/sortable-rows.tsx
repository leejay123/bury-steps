"use client";

import { useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";

export function DragHandle({ label }: { label: string }) {
  return (
    <span
      aria-label={label}
      className="inline-flex cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
      data-drag-handle
    >
      <GripVertical className="size-4" />
    </span>
  );
}

export function useSortableIds(ids: string[], onReorder: (ids: string[]) => void) {
  const [order, setOrder] = useState(ids);
  const orderRef = useRef(ids);
  const dragId = useRef<string | null>(null);
  const didDrag = useRef(false);
  const skipClick = useRef(false);
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  useEffect(() => {
    setOrder(ids);
    orderRef.current = ids;
  }, [ids]);

  function move(overId: string) {
    const fromId = dragId.current;
    if (!fromId || fromId === overId) return;
    const current = orderRef.current;
    const from = current.indexOf(fromId);
    const to = current.indexOf(overId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...current];
    next.splice(from, 1);
    next.splice(to, 0, fromId);
    orderRef.current = next;
    setOrder(next);
    didDrag.current = true;
  }

  function finish() {
    if (!dragId.current) return;
    dragId.current = null;
    if (didDrag.current) {
      skipClick.current = true;
      onReorderRef.current(orderRef.current);
      queueMicrotask(() => {
        skipClick.current = false;
      });
    }
    didDrag.current = false;
  }

  return {
    order,
    rowProps(id: string) {
      return {
        "data-sortable-id": id,
        draggable: true,
        onClickCapture(event: React.MouseEvent) {
          if (!skipClick.current) return;
          event.preventDefault();
          event.stopPropagation();
        },
        onDragStart(event: React.DragEvent) {
          if (!(event.target as HTMLElement).closest("[data-drag-handle]")) {
            event.preventDefault();
            return;
          }
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", id);
          dragId.current = id;
          didDrag.current = false;
        },
        onDragOver(event: React.DragEvent) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          move(id);
        },
        onDrop(event: React.DragEvent) {
          event.preventDefault();
          finish();
        },
        onDragEnd() {
          finish();
        },
        onPointerDown(event: React.PointerEvent) {
          if (!(event.target as HTMLElement).closest("[data-drag-handle]")) return;
          dragId.current = id;
          didDrag.current = false;
          (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
        },
        onPointerMove(event: React.PointerEvent) {
          if (!dragId.current || event.buttons === 0) return;
          const under = document.elementFromPoint(event.clientX, event.clientY);
          const overId = under?.closest("[data-sortable-id]")?.getAttribute("data-sortable-id");
          if (overId) move(overId);
        },
        onPointerUp() {
          finish();
        },
      };
    },
  };
}
