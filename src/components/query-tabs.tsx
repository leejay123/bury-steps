"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Tabs } from "@/components/ui/tabs";

/**
 * Tabs whose current panel is `?tab=` in the address, so a breadcrumb can
 * open History or All walks directly. The default tab drops the query so
 * the usual list address stays clean.
 */
export function QueryTabs({
  className,
  param = "tab",
  defaultValue,
  children,
}: {
  className?: string;
  param?: string;
  defaultValue: string;
  children: ReactNode;
}) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get(param);
    if (tab) setValue(tab);
  }, [param]);

  const onValueChange = useCallback(
    (next: string) => {
      setValue(next);
      const url = new URL(window.location.href);
      if (next === defaultValue) url.searchParams.delete(param);
      else url.searchParams.set(param, next);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    },
    [defaultValue, param],
  );

  return (
    <Tabs className={className} onValueChange={onValueChange} value={value}>
      {children}
    </Tabs>
  );
}
