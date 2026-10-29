"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SearchScope = "walks" | "pages" | "questions";
export type SearchItem = { href: string; label: string; caption?: string; scope: SearchScope };

const SCOPES: { id: "all" | SearchScope; label: string; header: string }[] = [
  { id: "all", label: "All", header: "" },
  { id: "walks", label: "Walks", header: "Walks" },
  { id: "pages", label: "Pages", header: "Pages" },
  { id: "questions", label: "Questions", header: "Questions" },
];

const QUICK_LINKS = [
  { href: "/walks", label: "Explore All Walks" },
  { href: "/notices", label: "Notices" },
  { href: "/progress", label: "Group progress" },
  { href: "/#faq", label: "Questions people ask" },
  { href: "/contact", label: "Contact us" },
];

function Arrow() {
  return (
    <span className="globalnav-searchresults-list-icon">
      <svg aria-hidden="true" height="16" viewBox="0 0 9 16" width="9">
        <path
          d="M.6 8h7.2M5 5.1 7.9 8 5 10.9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1"
        />
      </svg>
    </span>
  );
}

export type SearchPanelHandle = { focus: () => void; reset: () => void };

/**
 * The search panel as on shadcn.io (their markup and classes, used with
 * permission): a large field, filter tabs with key hints, then Quick Links or
 * results grouped by kind. ↑/↓ move, ↵ opens, ⌘↵ opens in a new tab, ⇥ changes
 * the filter.
 */
export const SearchPanel = forwardRef<SearchPanelHandle, { items: SearchItem[]; siteName: string; onGo: () => void }>(
  function SearchPanel({ items, siteName, onGo }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [scope, setScope] = useState<(typeof SCOPES)[number]["id"]>("all");
    const [active, setActive] = useState(0);
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      reset: () => {
        setQuery("");
        setScope("all");
        setActive(0);
      },
    }));

    const words = query.trim().toLowerCase();
    const matches = (item: SearchItem) => `${item.label} ${item.caption ?? ""}`.toLowerCase().includes(words);
    const found = words ? items.filter(matches) : [];
    const upcoming = items.filter((item) => item.scope === "walks").slice(0, 6);
    const inScope = scope === "all" ? found : found.filter((item) => item.scope === scope);
    const groups = words
      ? SCOPES.filter((s) => s.id !== "all" && (scope === "all" || scope === s.id))
          .map((s) => ({ ...s, list: inScope.filter((item) => item.scope === s.id).slice(0, 8) }))
          .filter((group) => group.list.length > 0)
      : [
          { id: "quick", label: "", header: "Quick Links", list: QUICK_LINKS.map((link) => ({ ...link, scope: "pages" as const })) },
          // As their "Popular Components": the next few walks, with their dates beside them.
          ...(upcoming.length ? [{ id: "upcoming", label: "", header: "Walks Coming Up", list: upcoming }] : []),
        ];
    const flat = groups.flatMap((group) => group.list);
    const current = Math.min(active, Math.max(0, flat.length - 1));

    const go = (href: string, newTab: boolean) => {
      if (newTab) window.open(href, "_blank", "noopener");
      else {
        onGo();
        window.location.assign(href);
      }
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActive((current + step + flat.length) % Math.max(1, flat.length));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const item = flat[current];
        if (item) go(item.href, event.metaKey || event.ctrlKey);
      } else if (event.key === "Tab") {
        event.preventDefault();
        const i = SCOPES.findIndex((s) => s.id === scope);
        setScope(SCOPES[(i + (event.shiftKey ? SCOPES.length - 1 : 1)) % SCOPES.length]!.id);
        setActive(0);
      }
    };

    // Where each group's links start in the one list ↑/↓ moves through.
    const starts = groups.map((_, g) => groups.slice(0, g).reduce((n, group) => n + group.list.length, 0));
    return (
      <div className="globalnav-search-panel" style={{ "--gn-items": String(flat.length) } as React.CSSProperties}>
        <form className="globalnav-searchfield" onSubmit={(event) => event.preventDefault()}>
          <div className="globalnav-searchfield-wrapper">
            <input
              aria-controls="globalnav-searchresults"
              aria-label="Search the site"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className="globalnav-searchfield-input"
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={`Search ${siteName}`}
              ref={inputRef}
              spellCheck={false}
              type="search"
              value={query}
            />
            <button
              aria-label="Clear search"
              className="globalnav-searchfield-reset"
              data-visible={query ? "" : undefined}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              tabIndex={query ? 0 : -1}
              type="button"
            >
              <svg aria-hidden="true" height="14" viewBox="0 0 14 14" width="14">
                <circle cx="7" cy="7" fill="currentColor" r="7" />
                <path
                  d="m4.7 4.7 4.6 4.6m0-4.6L4.7 9.3"
                  stroke="var(--gn-background-opened)"
                  strokeLinecap="round"
                  strokeWidth="1.1"
                />
              </svg>
            </button>
            <button aria-hidden="true" className="globalnav-searchfield-submit" tabIndex={-1} type="submit">
              <svg aria-hidden="true" className="globalnav-icon-regular" height="32" viewBox="0 0 30 32" width="30">
                <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                  <circle cx="13.5" cy="14.7" r="6.4" />
                  <path d="m18.3 19.5 4.4 4.4" />
                </g>
              </svg>
              <svg aria-hidden="true" className="globalnav-icon-compact" height="40" viewBox="0 0 38 40" width="38">
                <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
                  <circle cx="17.2" cy="17.9" r="7.3" />
                  <path d="m22.6 23.3 5.2 5.2" />
                </g>
              </svg>
            </button>
          </div>
          <output aria-live="polite" className="sr-only">
            {words ? `${inScope.length} results` : ""}
          </output>
        </form>
        <div className="globalnav-searchbar">
          <div aria-label="Filter" className="globalnav-searchscopes" role="tablist">
            {SCOPES.map((s) => (
              <button
                aria-selected={scope === s.id}
                className="globalnav-searchscope"
                data-empty={words && s.id !== "all" && !found.some((item) => item.scope === s.id) ? "" : undefined}
                key={s.id}
                onClick={() => {
                  setScope(s.id);
                  setActive(0);
                  inputRef.current?.focus();
                }}
                role="tab"
                tabIndex={-1}
                type="button"
              >
                <span className="globalnav-searchscope-label">{s.label}</span>
              </button>
            ))}
          </div>
          <div className="globalnav-searchhints">
            <span>
              <kbd className="globalnav-searchhints-key">↵</kbd> Open
            </span>
            <span>
              <kbd className="globalnav-searchhints-key">⌘</kbd>
              <kbd className="globalnav-searchhints-key">↵</kbd> New tab
            </span>
            <span>
              <kbd className="globalnav-searchhints-key">⇥</kbd> Filter
            </span>
          </div>
        </div>
        <div
          className={cn("globalnav-searchresults", words && flat.length > 0 && "globalnav-search-with-results")}
          id="globalnav-searchresults"
        >
          <div className="globalnav-searchresults-current">
            {words && flat.length === 0 ? (
              <p className="globalnav-searchresults-message">No results for “{query.trim()}”.</p>
            ) : (
              <div className="globalnav-searchresults-columns">
                {groups.map((group, g) => (
                  <div className="globalnav-searchresults-container" key={group.id} style={{ "--gn-group": String(g) } as React.CSSProperties}>
                    <h2 className="globalnav-searchresults-header" id={`globalnav-search-${group.id}`} style={{ "--gn-item": "0" } as React.CSSProperties}>
                      {group.header}
                    </h2>
                    <ul aria-labelledby={`globalnav-search-${group.id}`} className="globalnav-searchresults-list">
                      {group.list.map((item, i) => {
                        const mine = starts[g]! + i;
                        return (
                          <li
                            className="globalnav-searchresults-list-item"
                            key={`${item.href}-${item.label}`}
                            style={{ "--gn-item": String(i + 1) } as React.CSSProperties}
                          >
                            <a
                              className="globalnav-searchresults-list-link"
                              data-highlighted={mine === current ? "" : undefined}
                              href={item.href}
                              onClick={(event) => {
                                event.preventDefault();
                                go(item.href, event.metaKey || event.ctrlKey);
                              }}
                              onMouseEnter={() => setActive(mine)}
                              tabIndex={-1}
                            >
                              <Arrow />
                              <span className="globalnav-searchresults-list-label">
                                <span className="globalnav-searchresults-list-title">{item.label}</span>
                                {"caption" in item && item.caption ? (
                                  <span className="globalnav-searchresults-list-caption">{item.caption}</span>
                                ) : null}
                              </span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
