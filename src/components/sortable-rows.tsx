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
  }

  function finish() {
    if (!dragId.current) return;
    dragId.current = null;
    onReorderRef.current(orderRef.current);
  }

  return {
    order,
    rowProps(id: string) {
      return {
        draggable: true,
        onDragStart(event: React.DragEvent) {
          if (!(event.target as HTMLElement).closest("[data-drag-handle]")) {
            event.preventDefault();
            return;
          }
          dragId.current = id;
        },
        onDragOver(event: React.DragEvent) {
          event.preventDefault();
          move(id);
        },
        onDrop(event: React.DragEvent) {
          event.preventDefault();
          finish();
        },
        onDragEnd() {
          finish();
        },
      };
    },
  };
}
