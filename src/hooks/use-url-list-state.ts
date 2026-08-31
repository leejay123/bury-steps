"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Search + page state that lives in the URL (`?q=&page=`) instead of
 * client-side memory, so the admin list behind it can be filtered and
 * paginated on the server — matching the whole dataset instead of shipping
 * every row to the browser and filtering there. The search box is
 * debounced so typing doesn't fire a server round trip on every keystroke.
 *
 * Other query keys already on the URL (e.g. report link/sort filters) are
 * preserved when search or page changes.
 */
export function useUrlListState({
  debounceMs = 300,
  /** When false, search stays in React state only (e.g. accident reports PII). */
  syncQueryToUrl = true,
}: {
  debounceMs?: number;
  syncQueryToUrl?: boolean;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const appliedQuery = syncQueryToUrl ? (searchParams.get("q") ?? "") : "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  // The input shows what's being typed immediately; the URL (and the
  // server query it drives) only catches up after the debounce — unless
  // syncQueryToUrl is off, in which case only local state updates.
  const [query, setQueryState] = useState(appliedQuery);
  useEffect(() => {
    if (syncQueryToUrl) setQueryState(appliedQuery);
  }, [appliedQuery, syncQueryToUrl]);

  // Drop leftover ?q= when search is client-only (e.g. members / reports PII).
  useEffect(() => {
    if (syncQueryToUrl) return;
    if (!searchParams.has("q")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    const search = params.toString();
    startTransition(() => {
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    });
  }, [pathname, router, searchParams, syncQueryToUrl, startTransition]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const navigate = useCallback(
    (nextQuery: string, nextPage: number, patch?: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      // Drop any leftover ?q= even when we no longer sync search to the URL.
      if (syncQueryToUrl && nextQuery) params.set("q", nextQuery);
      else params.delete("q");
      if (nextPage > 1) params.set("page", String(nextPage));
      else params.delete("page");
      if (patch) {
        for (const [key, value] of Object.entries(patch)) {
          if (value === null || value === "") params.delete(key);
          else params.set(key, value);
        }
      }
      const search = params.toString();
      startTransition(() => {
        router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams, syncQueryToUrl],
  );

  const setQuery = useCallback(
    (next: string) => {
      setQueryState(next);
      if (!syncQueryToUrl) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => navigate(next, 1), debounceMs);
    },
    [debounceMs, navigate, syncQueryToUrl],
  );

  const setPage = useCallback(
    (next: number) => {
      navigate(syncQueryToUrl ? appliedQuery : "", next);
    },
    [appliedQuery, navigate, syncQueryToUrl],
  );

  const setFilter = useCallback(
    (key: string, value: string, defaultValue: string) => {
      navigate(syncQueryToUrl ? appliedQuery : "", 1, {
        [key]: value === defaultValue ? null : value,
      });
    },
    [appliedQuery, navigate, syncQueryToUrl],
  );

  return { query, page, setQuery, setPage, setFilter, isPending, searchParams };
}
