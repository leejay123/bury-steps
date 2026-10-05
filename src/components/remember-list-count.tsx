"use client";

import { useEffect } from "react";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { rememberedRowsCookie, writeClientCookie } from "@/lib/remembered-rows-key";

/** Remembers a short piece of copy, so the next refresh can reserve exactly that height. */
export function RememberText({ name, value, max = 500 }: { name: string; value: string; max?: number }) {
  useEffect(() => {
    writeClientCookie(name, encodeURIComponent(value.slice(0, max)));
  }, [name, value, max]);
  return null;
}

/** Remembers how many rows this list showed, so the next refresh can draw that many. */
export function RememberListCount({
  id,
  count,
  max = LIST_PAGE_SIZE,
}: {
  id: string;
  count: number;
  max?: number;
}) {
  useEffect(() => {
    const rows = Math.max(0, Math.min(count, max));
    writeClientCookie(rememberedRowsCookie(id), String(rows));
  }, [id, count, max]);
  return null;
}
