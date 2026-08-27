"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type PointerEvent as ReactPointerEvent } from "react";
import { GripVertical } from "lucide-react";

export function DragHandle({
  label,
  ...props
}: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={label}
      className="inline-flex cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
      data-drag-handle
      type="button"
      {...props}
    >
      <GripVertical className="size-4" />
    </button>
  );
}

function clearDragStyles() {
  document.body.style.removeProperty("cursor");
  document.body.style.removeProperty("user-select");
  document.body.style.removeProperty("touch-action");
}

export function useSortableIds(ids: string[], onReorder: (ids: string[]) => void) {
  const [order, setOrder] = useState(ids);
  const orderRef = useRef(ids);
  const dragId = useRef<string | null>(null);
  const didDrag = useRef(false);
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

    function onMove(event: PointerEvent) {
      if (!dragId.current) return;
      event.preventDefault();
      const under = document.elementFromPoint(event.clientX, event.clientY);
      const overId = under?.closest("[data-sortable-id]")?.getAttribute("data-sortable-id");
      if (overId) move(overId);
    }

    function onUp() {
      if (!dragId.current) return;
      dragId.current = null;
      clearDragStyles();
      if (didDrag.current) {
        onReorderRef.current(orderRef.current);
        const swallow = (event: Event) => {
          event.stopPropagation();
          event.preventDefault();
          window.removeEventListener("click", swallow, true);
        };
        window.addEventListener("click", swallow, true);
      }
      didDrag.current = false;
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onUp, true);
    window.addEventListener("blur", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
      window.removeEventListener("blur", onUp);
      clearDragStyles();
      dragId.current = null;
    };
  }, []);

  return {
    order,
    rowProps(id: string) {
      return { "data-sortable-id": id };
    },
    handleProps(id: string) {
      return {
        onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
          if (event.button !== 0) return;
          event.preventDefault();
          event.stopPropagation();
          dragId.current = id;
          didDrag.current = false;
          document.body.style.cursor = "grabbing";
          document.body.style.userSelect = "none";
          document.body.style.touchAction = "none";
        },
      };
    },
  };
}
