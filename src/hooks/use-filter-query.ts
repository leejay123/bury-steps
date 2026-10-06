"use client";

import { parseAsString, parseAsStringLiteral } from "nuqs";
import { useQueryState } from "nuqs";

const textOptions = {
  shallow: true,
  history: "replace" as const,
  clearOnDefault: true,
  throttleMs: 300,
};

const choiceOptions = {
  shallow: true,
  history: "replace" as const,
  clearOnDefault: true,
};

/** A search box whose text stays in the address without reloading the page. */
export function useQueryText(key: string) {
  return useQueryState(key, parseAsString.withDefault("").withOptions(textOptions));
}

/** A short token in the address, such as a year, with its own default. */
export function useQueryDefault(key: string, defaultValue: string) {
  return useQueryState(key, parseAsString.withDefault(defaultValue).withOptions(choiceOptions));
}
export function useQueryChoice<const T extends readonly [string, ...string[]]>(
  key: string,
  values: T,
  defaultValue: T[number],
): [T[number], (value: T[number] | null) => Promise<URLSearchParams>] {
  // nuqs widens a literal parser once options are attached, so the tuple is
  // named again here. Callers still only see the allowed values.
  return useQueryState(
    key,
    parseAsStringLiteral(values).withDefault(defaultValue).withOptions(choiceOptions),
  ) as [T[number], (value: T[number] | null) => Promise<URLSearchParams>];
}
