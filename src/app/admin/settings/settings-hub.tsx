"use client";

import { Fragment, useDeferredValue, useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronDown, ChevronRight, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { unlockIdleDocument } from "@/components/overlay-root";
import { SettingsPageIcon } from "@/components/settings-page-icons";
import { DataList, DataListBody, DataListItem } from "@/components/data-list";
import { EmptyState } from "@/components/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { SettingsPageLink } from "@/lib/settings-pages";

/** Where a setting stands right now, worked out on the server. */
export type SettingsRowState = {
  /** Short current value, e.g. "2 of 3 photos". */
  status?: string;
  /** Something unfinished or broken that someone should sort out. */
  attention?: string;
};

export type SettingsHubPage = SettingsPageLink &
  SettingsRowState & { danger?: boolean; children?: SettingsPageLink[] };

export type SettingsHubGroup = { label: string; danger: boolean; pages: SettingsHubPage[] };

function matches(link: SettingsPageLink & SettingsRowState, needle: string): boolean {
  return [link.title, link.description, link.keywords, link.status, link.attention]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

function navigate() {
  unlockIdleDocument();
}

function GroupHeader({ danger, label }: { danger: boolean; label: string }) {
  return (
    <li
      aria-hidden
      className={cn(
        "border-b bg-muted/50 px-4 py-2 text-xs font-semibold tracking-wide uppercase",
        danger ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {label}
    </li>
  );
}

function RowText({ page }: { page: SettingsHubPage }) {
  return (
    <DataListBody className="flex flex-col gap-1">
      <div className="flex flex-col gap-x-3 gap-y-0.5 sm:flex-row sm:items-baseline sm:justify-between">
        <p className={cn("font-medium leading-snug", page.danger && "text-destructive")}>
          {page.title}
        </p>
        {page.status ? (
          <p className="text-xs text-muted-foreground tabular-nums sm:shrink-0 sm:text-right">
            {page.status}
          </p>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">{page.description}</p>
      {page.attention ? (
        <p className="flex items-start gap-1.5 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {page.attention}
        </p>
      ) : null}
    </DataListBody>
  );
}

function RowIcon({ page }: { page: SettingsHubPage }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background",
        page.danger ? "border-destructive/30 text-destructive" : "text-muted-foreground",
      )}
    >
      <SettingsPageIcon aria-hidden className="size-4" href={page.href} />
    </span>
  );
}

/** A plain row: the whole card is one link to the page. */
function LinkRow({ page }: { page: SettingsHubPage }) {
  return (
    <DataListItem className="relative items-start gap-3 px-4 py-3.5">
      <RowIcon page={page} />
      <RowText page={page} />
      <ChevronRight aria-hidden className="mt-2.5 size-4 shrink-0 text-muted-foreground" />
      <Link
        aria-label={page.title}
        className="absolute inset-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        href={page.href}
        prefetch={true}
        onClick={navigate}
      />
    </DataListItem>
  );
}

/** A row with sub-pages (Site wording): tapping it opens the list of its
 * pages in place, rather than jumping straight to the first one. */
function ExpandableRow({
  expanded,
  onToggle,
  page,
  visibleChildren,
}: {
  expanded: boolean;
  onToggle: () => void;
  page: SettingsHubPage;
  visibleChildren: SettingsPageLink[];
}) {
  const listId = `settings-children-${page.href.replaceAll("/", "-")}`;
  return (
    <>
      <DataListItem className="relative items-start gap-3 px-4 py-3.5">
        <RowIcon page={page} />
        <RowText page={page} />
        <ChevronDown
          aria-hidden
          className={cn(
            "mt-2.5 size-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
        <button
          aria-controls={listId}
          aria-expanded={expanded}
          aria-label={`${page.title} — ${expanded ? "hide" : "show"} its pages`}
          className="absolute inset-0 cursor-pointer rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          onClick={onToggle}
          type="button"
        />
      </DataListItem>
      {expanded ? (
        <li className="border-b bg-muted/20" id={listId}>
          <ul className="flex flex-col py-1 pl-[3.75rem]">
            {visibleChildren.map((child) => (
              <li key={child.href}>
                <Link
                  className="group flex items-center gap-3 rounded-md py-2 pr-4 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={child.href}
                  prefetch={true}
                  onClick={navigate}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{child.title}</span>
                    <span className="block text-sm text-muted-foreground">{child.description}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ) : null}
    </>
  );
}

export function SettingsHub({ groups }: { groups: SettingsHubGroup[] }) {
  const [query, setQuery] = useState("");
  const needle = useDeferredValue(query).trim().toLowerCase();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const needsAttention = groups.flatMap((group) => group.pages.filter((page) => page.attention));

  // While searching, a row stays if it or any of its sub-pages match, and
  // a matching sub-page opens its parent so the hit is actually visible.
  const filtered = groups
    .map((group) => ({
      ...group,
      pages: group.pages.flatMap((page) => {
        const children = page.children ?? [];
        if (!needle) return [{ page, children, forceOpen: false }];
        const childHits = children.filter((child) => matches(child, needle));
        if (matches(page, needle)) return [{ page, children, forceOpen: childHits.length > 0 }];
        if (childHits.length > 0) return [{ page, children: childHits, forceOpen: true }];
        return [];
      }),
    }))
    .filter((group) => group.pages.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {needsAttention.length > 0 ? (
        <Alert variant="warning">
          <AlertCircle aria-hidden />
          <AlertTitle>
            {needsAttention.length === 1
              ? "1 thing needs attention"
              : `${needsAttention.length} things need attention`}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4">
              {needsAttention.map((page) => (
                <li key={page.href}>
                  <Link className="font-medium underline underline-offset-2" href={page.href} onClick={navigate} prefetch={true}>
                    {page.title}
                  </Link>
                  : {page.attention}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <InputGroup>
        <InputGroupInput
          aria-label="Search settings"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search settings…"
          type="search"
          value={query}
        />
        <InputGroupAddon>
          <Search data-icon="inline-start" />
        </InputGroupAddon>
      </InputGroup>

      {filtered.length === 0 ? (
        <EmptyState
          description="Try a different word, or clear the search to see every setting."
          icon={SearchX}
          title={`No settings match “${query.trim()}”`}
        />
      ) : (
        <DataList>
          {filtered.map((group) => (
            <Fragment key={group.label}>
              <GroupHeader danger={group.danger} label={group.label} />
              {group.pages.map(({ page, children, forceOpen }) =>
                page.children ? (
                  <ExpandableRow
                    expanded={forceOpen || Boolean(expanded[page.href])}
                    key={page.href}
                    onToggle={() =>
                      setExpanded((current) => ({ ...current, [page.href]: !current[page.href] }))
                    }
                    page={page}
                    visibleChildren={children}
                  />
                ) : (
                  <LinkRow key={page.href} page={page} />
                ),
              )}
            </Fragment>
          ))}
        </DataList>
      )}
    </div>
  );
}
