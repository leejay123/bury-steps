"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { setColorMode } from "@/components/color-mode";
import { NAV_COOKIE, parseRememberedNav } from "@/lib/remembered-nav";

export type GlobalNavLink = { href: string; label: string };
export type SearchItem = { href: string; label: string; caption?: string };

const SIGN_IN_PILL =
  "cn-button group/button relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap outline-none transition-transform disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-disabled:pointer-events-none data-disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[state=loading]:pointer-events-none cn-button-size-sm cn-button-variant-default rounded-[calc(var(--radius)*100)] globalnav-signin";

function readMenu() {
  const raw = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${NAV_COOKIE}=`))
    ?.slice(NAV_COOKIE.length + 1);
  return raw ?? "";
}

/** The signed-in person's menu (remembered by the site's own header), or "" for a visitor. */
function useRememberedMenu() {
  return useSyncExternalStore(
    () => () => {},
    readMenu,
    () => "",
  );
}

/**
 * shadcn.io's header (their "globalnav", used with their permission) with
 * Bury Steps' menu: the logo and name, the links, then search, the light/
 * dark switch and Sign in; on phones a menu button opens the links full
 * screen. Their stylesheet does the look and the animation; this only adds
 * and removes the same state classes their own script does.
 */
export function GlobalNav({
  siteName,
  logoSrc,
  links,
  search,
  signInHref,
}: {
  siteName: string;
  logoSrc: string;
  /** The visitor's menu; a signed-in member's remembered menu replaces it. */
  links: GlobalNavLink[];
  search: SearchItem[];
  signInHref: string;
}) {
  const remembered = useRememberedMenu();
  const memberLinks = remembered ? parseRememberedNav(remembered) : [];
  const menu = memberLinks.length ? memberLinks : links;
  const signedIn = memberLinks.length > 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [query, setQuery] = useState("");
  const breadRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContentRef = useRef<HTMLDivElement>(null);
  // The search panel's height (their script measures it the same way).
  const [flyoutHeight, setFlyoutHeight] = useState(0);

  const playBread = (kind: "open" | "close") => {
    breadRef.current
      ?.querySelectorAll<SVGAnimateElement>(`animate[data-bread="${kind}"]`)
      .forEach((animate) => animate.beginElement());
  };

  const animate = () => {
    setAnimating(true);
    window.setTimeout(() => setAnimating(false), 500);
  };

  const closeSearch = () => {
    if (!searchOpen) return;
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      setSearchOpen(false);
      setQuery("");
    }, 320);
  };

  const toggleMenu = () => {
    animate();
    playBread(menuOpen ? "close" : "open");
    setMenuOpen(!menuOpen);
    if (searchOpen) closeSearch();
  };

  // The page underneath stays put while the phone menu or search is open.
  useEffect(() => {
    const lock = menuOpen || searchOpen;
    document.documentElement.classList.toggle("globalnav-noscroll", lock);
    return () => document.documentElement.classList.remove("globalnav-noscroll");
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => inputRef.current?.focus(), 250);
  }, [searchOpen]);

  useEffect(() => {
    const content = searchContentRef.current;
    if (!searchOpen || !content) return;
    const measure = () => setFlyoutHeight(content.offsetHeight + 56);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (searchOpen) closeSearch();
      else if (menuOpen) toggleMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const words = query.trim().toLowerCase();
  const results = words
    ? search.filter((item) => `${item.label} ${item.caption ?? ""}`.toLowerCase().includes(words)).slice(0, 8)
    : search.slice(0, 6);

  return (
    <header className="globalnav-header" data-slot="site-header">
      <nav
        aria-label="Global"
        className={cn(
          "globalnav",
          // Their phone menu is a panel too: it opens with both classes.
          menuOpen && "globalnav-with-menu-open",
          (searchOpen || menuOpen) && "globalnav-with-flyout-open",
          closing && "globalnav-with-flyout-closing",
          animating && "globalnav-animating",
        )}
      >
        <div className="globalnav-content">
          <div className="globalnav-item globalnav-menuback">
            <button aria-label="Main menu" className="globalnav-menuback-button" onClick={toggleMenu} type="button">
              <svg aria-hidden="true" height="48" viewBox="0 0 9 48" width="9">
                <path
                  d="M7.6 17.2 1 24l6.6 6.8"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.2"
                />
              </svg>
            </button>
          </div>
          <ul className="globalnav-list" id="globalnav-list">
            <li className="globalnav-item globalnav-start">
              <Link aria-label={`${siteName}, home`} className="globalnav-link globalnav-brand" href="/">
                <span className="brand-mark globalnav-brand-mark">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" className="size-full rounded-full object-contain" src={logoSrc} />
                </span>
                <span aria-hidden="true" className="globalnav-brand-name">
                  {siteName}
                </span>
              </Link>
            </li>
            <li className={cn("globalnav-item globalnav-menu", menuOpen && "globalnav-item-flyout-open")}>
              <div className="globalnav-menu-flyout">
                <ul className="globalnav-menu-list" style={{ "--gn-items": String(menu.length) } as React.CSSProperties}>
                  {menu.map((item, i) => (
                    <li
                      className="globalnav-item globalnav-item-menu"
                      key={item.href}
                      style={{ "--gn-item": String(i) } as React.CSSProperties}
                    >
                      <div className="globalnav-trigger">
                        <Link className="globalnav-link" href={item.href} onClick={() => menuOpen && toggleMenu()}>
                          <span className="globalnav-link-text">{item.label}</span>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
            <li className="globalnav-item globalnav-end">
              <ul className="globalnav-end-list">
                <li
                  className={cn(
                    "globalnav-item globalnav-item-icon globalnav-search",
                    searchOpen && "globalnav-item-flyout-open",
                    closing && "globalnav-item-flyout-closing",
                  )}
                >
                  <button
                    aria-controls="globalnav-flyout-search"
                    aria-expanded={searchOpen}
                    aria-label="Search"
                    className="globalnav-link"
                    onClick={() => (searchOpen ? closeSearch() : (animate(), setSearchOpen(true)))}
                    type="button"
                  >
                    <svg aria-hidden="true" className="globalnav-icon-regular" height="44" viewBox="0 0 15 44" width="15">
                      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1">
                        <circle cx="6" cy="20" r="5" />
                        <path d="m9.7 23.7 4.1 4.1" />
                      </g>
                    </svg>
                    <svg aria-hidden="true" className="globalnav-icon-compact" height="48" viewBox="0 0 17 48" width="17">
                      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25">
                        <circle cx="7" cy="21.6" r="5.85" />
                        <path d="m11.3 25.9 4.6 4.5" />
                      </g>
                    </svg>
                  </button>
                  <div
                    className={cn("globalnav-flyout", (searchOpen || closing) && "globalnav-flyout-awake")}
                    id="globalnav-flyout-search"
                    style={{ "--gn-flyout-height": `${searchOpen && !closing ? flyoutHeight : 0}px` } as React.CSSProperties}
                  >
                    <div className="globalnav-flyout-scroll">
                      <div className="globalnav-flyout-content" ref={searchContentRef}>
                        <div className="globalnav-searchbar">
                          <form
                            className="w-full"
                            onSubmit={(event) => {
                              event.preventDefault();
                              const first = results[0];
                              if (first) window.location.href = first.href;
                            }}
                            role="search"
                          >
                            <div className="globalnav-searchfield-wrapper">
                              <input
                                aria-label="Search walks and pages"
                                autoComplete="off"
                                className="globalnav-searchfield-input"
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search walks and pages"
                                ref={inputRef}
                                type="search"
                                value={query}
                              />
                              <button
                                aria-label="Clear"
                                className="globalnav-searchfield-reset"
                                data-visible={query ? "" : undefined}
                                onClick={() => setQuery("")}
                                type="button"
                              >
                                <svg aria-hidden="true" height="14" viewBox="0 0 14 14" width="14">
                                  <path d="M3 3l8 8M11 3l-8 8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
                                </svg>
                              </button>
                              <button aria-label="Search" className="globalnav-searchfield-submit" type="submit">
                                <svg aria-hidden="true" height="20" viewBox="0 0 17 20" width="17">
                                  <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25">
                                    <circle cx="7" cy="8" r="5.85" />
                                    <path d="m11.3 12.3 4.6 4.5" />
                                  </g>
                                </svg>
                              </button>
                            </div>
                          </form>
                        </div>
                        <div className="globalnav-searchresults">
                          <div className="globalnav-searchresults-current">
                            <div className="globalnav-searchresults-container">
                              <h2 className="globalnav-searchresults-header">{words ? "Results" : "Quick links"}</h2>
                              {results.length === 0 ? (
                                <p className="globalnav-searchresults-message">Nothing found. Try another word.</p>
                              ) : (
                                <ul className="globalnav-searchresults-list">
                                  {results.map((item) => (
                                    <li className="globalnav-searchresults-list-item" key={item.href + item.label}>
                                      <Link className="globalnav-searchresults-list-link" href={item.href} onClick={closeSearch}>
                                        <span aria-hidden="true" className="globalnav-searchresults-list-icon">
                                          <svg height="14" viewBox="0 0 9 14" width="9">
                                            <path d="M1.4 1.2 8 7l-6.6 5.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
                                          </svg>
                                        </span>
                                        <span className="globalnav-searchresults-list-label">
                                          <span className="globalnav-searchresults-list-title">{item.label}</span>
                                          {item.caption ? (
                                            <span className="globalnav-searchresults-list-caption">{item.caption}</span>
                                          ) : null}
                                        </span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="globalnav-item globalnav-item-tool">
                  <button
                    aria-label="Toggle theme"
                    className="globalnav-link"
                    onClick={() =>
                      setColorMode(document.documentElement.classList.contains("dark") ? "light" : "dark")
                    }
                    title="Toggle theme"
                    type="button"
                  >
                    <svg
                      aria-hidden="true"
                      className="globalnav-glyph globalnav-theme-glyph"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                      <path d="M12 3l0 18" />
                      <path d="M12 9l4.65 -4.65" />
                      <path d="M12 14.3l7.37 -7.37" />
                      <path d="M12 19.6l8.85 -8.85" />
                    </svg>
                  </button>
                </li>
                <li className="globalnav-item globalnav-item-icon globalnav-account">
                  {signedIn ? (
                    <Link className={SIGN_IN_PILL} href="/dashboard">
                      Dashboard
                    </Link>
                  ) : (
                    <a className={SIGN_IN_PILL} href={signInHref}>
                      Sign in
                    </a>
                  )}
                </li>
              </ul>
            </li>
          </ul>
          <div className="globalnav-menutrigger">
            <button
              aria-controls="globalnav-list"
              aria-expanded={menuOpen}
              aria-label="Menu"
              className="globalnav-menutrigger-button"
              onClick={toggleMenu}
              type="button"
            >
              <svg aria-hidden="true" height="18" ref={breadRef} viewBox="0 0 18 18" width="18">
                <polyline
                  fill="none"
                  points="2 12, 16 12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.2"
                >
                  <animate
                    attributeName="points"
                    begin="indefinite"
                    calcMode="spline"
                    data-bread="open"
                    dur="0.24s"
                    fill="freeze"
                    keySplines="0.42, 0, 1, 1;0, 0, 0.58, 1"
                    keyTimes="0;0.5;1"
                    values=" 2 12, 16 12; 2 9, 16 9; 3.5 15, 15 3.5"
                  />
                  <animate
                    attributeName="points"
                    begin="indefinite"
                    calcMode="spline"
                    data-bread="close"
                    dur="0.24s"
                    fill="freeze"
                    keySplines="0.42, 0, 1, 1;0, 0, 0.58, 1"
                    keyTimes="0;0.5;1"
                    values=" 3.5 15, 15 3.5; 2 9, 16 9; 2 12, 16 12"
                  />
                </polyline>
                <polyline
                  fill="none"
                  points="2 5, 16 5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.2"
                >
                  <animate
                    attributeName="points"
                    begin="indefinite"
                    calcMode="spline"
                    data-bread="open"
                    dur="0.24s"
                    fill="freeze"
                    keySplines="0.42, 0, 1, 1;0, 0, 0.58, 1"
                    keyTimes="0;0.5;1"
                    values=" 2 5, 16 5; 2 9, 16 9; 3.5 3.5, 15 15"
                  />
                  <animate
                    attributeName="points"
                    begin="indefinite"
                    calcMode="spline"
                    data-bread="close"
                    dur="0.24s"
                    fill="freeze"
                    keySplines="0.42, 0, 1, 1;0, 0, 0.58, 1"
                    keyTimes="0;0.5;1"
                    values=" 3.5 3.5, 15 15; 2 9, 16 9; 2 5, 16 5"
                  />
                </polyline>
              </svg>
            </button>
          </div>
        </div>
      </nav>
      <div
        aria-hidden="true"
        className={cn("globalnav-curtain", (menuOpen || searchOpen) && "globalnav-curtain-open")}
        onClick={() => (searchOpen ? closeSearch() : menuOpen ? toggleMenu() : undefined)}
      />
    </header>
  );
}
