"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClientPathname } from "@/components/client-pathname";
import { PanelLeft } from "lucide-react";
import { SIDEBAR_TOGGLE_EVENT } from "./sidebar-state";
import { NAV_COOKIE, parseRememberedNav } from "@/lib/remembered-nav";
import { CustomizeDot, CustomizePanel } from "./customize-panel";
import { setColorMode } from "@/components/color-mode";
import { GlobalnavController } from "./globalnav-controller";
import { shortMenu, type NavSection } from "./nav-sections";
import { SearchPanel, type SearchItem, type SearchPanelHandle } from "./search-panel";

export type { SearchItem };
export type GlobalNavLink = { href: string; label: string };

function readMenu() {
  return (
    document.cookie
      .split("; ")
      .find((part) => part.startsWith(`${NAV_COOKIE}=`))
      ?.slice(NAV_COOKIE.length + 1) ?? ""
  );
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
 * shadcn.io's header (their "globalnav", used with their permission): the
 * logo, the menu with its drop-downs, search, Customize, the theme switch and
 * Sign in; on phones a full-screen menu with sub-menus. Their stylesheet does
 * the look and every animation; their own controller (globalnav-controller)
 * runs it.
 */
export function GlobalNav({
  siteName,
  logoSrc,
  links,
  search,
  account,
  facebookUrl,
  sidebar = false,
}: {
  siteName: string;
  logoSrc: string;
  /** The visitor's menu; a signed-in member's remembered menu replaces it. */
  links: GlobalNavLink[];
  search: SearchItem[];
  /** Sign in, or the bell, Dashboard and avatar (rendered on the server). */
  account: ReactNode;
  facebookUrl: string;
  /** Pages with their dashboard sidebar: the sidebar button sits before the logo (theirs, exactly). */
  sidebar?: boolean;
}) {
  const remembered = useRememberedMenu();
  const memberLinks = remembered ? parseRememberedNav(remembered) : [];
  const menu: NavSection[] = shortMenu(memberLinks.length ? memberLinks : links, facebookUrl);

  const navRef = useRef<HTMLElement>(null);
  const searchRef = useRef<SearchPanelHandle>(null);
  const router = useRouter();
  const pathname = useClientPathname();
  const controller = useRef<GlobalnavController | null>(null);

  // Their controller runs the whole header; it is rebuilt when the menu changes
  // (a member's remembered menu arrives after the first paint).
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const control = new GlobalnavController(nav, {
      navigate: (href) => router.push(href),
      prefetch: (href) => router.prefetch(href),
    });
    controller.current = control;
    const search = nav.querySelector<HTMLElement>('[data-gn-id="search"]');
    const focus = () => window.setTimeout(() => searchRef.current?.focus(), 60);
    const reset = () => searchRef.current?.reset();
    search?.addEventListener("globalnav:willopen", focus);
    search?.addEventListener("globalnav:close", reset);
    return () => {
      search?.removeEventListener("globalnav:willopen", focus);
      search?.removeEventListener("globalnav:close", reset);
      control.destroy();
      controller.current = null;
    };
  }, [router, remembered]);

  useEffect(() => {
    if (pathname) controller.current?.route(pathname);
  }, [pathname, remembered]);

  const toggleTheme = () => setColorMode(document.documentElement.classList.contains("dark") ? "light" : "dark");
  // D switches light / dark, as on shadcn.io (not while typing).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "d" && event.key !== "D") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      )
        return;
      event.preventDefault();
      setColorMode(document.documentElement.classList.contains("dark") ? "light" : "dark");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const dismiss = () => navRef.current?.dispatchEvent(new CustomEvent("globalnav:dismiss"));

  const part = (i: number) => ({ "--gn-item": String(i) }) as React.CSSProperties;

  return (
    <header className="globalnav-header" data-slot="site-header">
      <nav aria-label="Global" className={sidebar ? "globalnav globalnav-with-leading" : "globalnav"} ref={navRef}>
        <div className="globalnav-content">
          <div className="globalnav-item globalnav-menuback">
            <button aria-label="Main menu" className="globalnav-menuback-button" data-gn-action="back" type="button">
              <svg aria-hidden="true" height="48" viewBox="0 0 9 48" width="9">
                <path d="M7.6 17.2 1 24l6.6 6.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
              </svg>
            </button>
          </div>
          <ul className="globalnav-list" id="globalnav-list">
            <li className="globalnav-item globalnav-start" data-gn-id="start">
              {sidebar ? (
                <div className="globalnav-leading">
                  <button
                    aria-label="Toggle sidebar"
                    className="cn-button group/button relative inline-flex select-none items-center justify-center whitespace-nowrap outline-none transition-transform disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 cn-button-size-icon cn-button-variant-ghost size-8 shrink-0"
                    data-size="icon-md"
                    data-slot="button"
                    data-variant="ghost"
                    onClick={() => window.dispatchEvent(new Event(SIDEBAR_TOGGLE_EVENT))}
                    type="button"
                  >
                    <PanelLeft aria-hidden className="cn-rtl-flip rtl:rotate-180" />
                  </button>
                </div>
              ) : null}
              <Link aria-label={`${siteName}, home`} className="globalnav-link globalnav-brand" href="/">
                <span className="brand-mark globalnav-brand-mark">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" className="size-full rounded-full object-contain" src={logoSrc} />
                </span>
              </Link>
            </li>
            <li className="globalnav-item globalnav-menu" data-gn-id="menu">
              <div className="globalnav-menu-flyout">
                <ul className="globalnav-menu-list" style={{ "--gn-items": String(menu.length) } as React.CSSProperties}>
                  {menu.map((section, i) => {
                    const hasFlyout = section.groups.length > 0;
                    const items = section.groups.reduce((n, group) => n + group.links.length + 1, 0);
                    return (
                      <li
                        className="globalnav-item globalnav-item-menu"
                        data-gn-id={section.id}
                        data-gn-kind={hasFlyout ? "section" : undefined}
                        key={section.id}
                        style={{ "--gn-item": String(i) } as React.CSSProperties}
                      >
                        <div className="globalnav-trigger">
                          <Link
                            className="globalnav-link"
                            data-gn-section={section.id}
                            href={section.href}
                          >
                            <span className="globalnav-link-text">{section.label}</span>
                            {hasFlyout ? (
                              <span aria-hidden="true" className="globalnav-link-chevron">
                                <svg aria-hidden="true" height="48" viewBox="0 0 9 48" width="9">
                                  <path d="M1.4 17.2 8 24l-6.6 6.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
                                </svg>
                              </span>
                            ) : null}
                          </Link>
                          {hasFlyout ? (
                            <button
                              aria-controls={`globalnav-flyout-${section.id}`}
                              aria-expanded="false"
                              aria-label={`${section.label} menu`}
                              className="globalnav-trigger-button"
                              data-gn-toggle={section.id}
                              type="button"
                            >
                              <svg aria-hidden="true" height="10" viewBox="0 0 10 10" width="10">
                                <path d="M2 3.6 5 6.6l3-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                              </svg>
                            </button>
                          ) : null}
                        </div>
                        {hasFlyout ? (
                          <div className="globalnav-flyout" id={`globalnav-flyout-${section.id}`}>
                            <div className="globalnav-flyout-scroll">
                              <div
                                className="globalnav-flyout-content"
                                style={
                                  {
                                    "--gn-elevated": "1",
                                    "--gn-groups": String(section.groups.length),
                                    "--gn-items": String(items),
                                  } as React.CSSProperties
                                }
                              >
                                {section.groups.map((group, g) => {
                                  return (
                                    <div
                                      className={`globalnav-group${group.elevated ? " globalnav-group-elevated" : ""}`}
                                      key={group.title}
                                      style={{ "--gn-group": String(g) } as React.CSSProperties}
                                    >
                                      <h2 className="globalnav-group-header" id={`globalnav-${section.id}-${g}`} style={part(1)}>
                                        {group.title}
                                      </h2>
                                      <ul aria-labelledby={`globalnav-${section.id}-${g}`} className="globalnav-group-list">
                                        {group.links.map((link, k) => {
                                          const item = k + 2;
                                          return (
                                            <li
                                              className={group.elevated ? "globalnav-group-item-elevated" : "globalnav-group-item"}
                                              key={link.label}
                                              style={part(item)}
                                            >
                                              <Link className="globalnav-group-link" href={link.href}>
                                                {link.label}
                                              </Link>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
            <li className="globalnav-item globalnav-end">
              <ul className="globalnav-end-list">
                <li className="globalnav-item globalnav-item-icon globalnav-search" data-gn-id="search" data-gn-kind="icon">
                  <button
                    aria-controls="globalnav-flyout-search"
                    aria-expanded="false"
                    aria-label="Search"
                    className="globalnav-link"
                    data-gn-toggle="search"
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
                  <div className="globalnav-flyout" id="globalnav-flyout-search">
                    <div className="globalnav-flyout-scroll">
                      <div className="globalnav-flyout-content">
                        <div>
                          <SearchPanel items={search} onGo={dismiss} ref={searchRef} siteName={siteName.split(" ").slice(0, 2).join(" ")} />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li
                  className="globalnav-item globalnav-item-icon globalnav-item-tool globalnav-customize-item"
                  data-gn-id="customize"
                  data-gn-kind="icon"
                >
                  <button
                    aria-controls="globalnav-flyout-customize"
                    aria-expanded="false"
                    aria-label="Customize"
                    className="globalnav-link"
                    data-gn-toggle="customize"
                    title="Customize"
                    type="button"
                  >
                    <svg
                      aria-hidden="true"
                      className="lucide lucide-wand-sparkles globalnav-glyph"
                      fill="none"
                      height="24"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="24"
                    >
                      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />
                      <path d="m14 7 3 3" />
                      <path d="M5 6v4" />
                      <path d="M19 14v4" />
                      <path d="M10 2v2" />
                      <path d="M7 8H3" />
                      <path d="M21 16h-4" />
                      <path d="M11 3H9" />
                    </svg>
                    <CustomizeDot />
                  </button>
                  <div className="globalnav-flyout" id="globalnav-flyout-customize">
                    <div className="globalnav-flyout-scroll">
                      <div className="globalnav-flyout-content" style={{ "--gn-items": "14" } as React.CSSProperties}>
                        <div>
                          <CustomizePanel />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="globalnav-item globalnav-item-icon globalnav-item-tool" data-gn-kind="icon">
                  {/* Their light / dark switch, with their icon (D on the keyboard, as on shadcn.io). */}
                  <button
                    aria-keyshortcuts="D"
                    aria-label="Toggle theme"
                    className="globalnav-link"
                    onClick={toggleTheme}
                    title="Toggle theme (D)"
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
                {account}
              </ul>
            </li>
          </ul>
          <div className="globalnav-menutrigger">
            <button
              aria-controls="globalnav-list"
              aria-expanded="false"
              aria-label="Menu"
              className="globalnav-menutrigger-button"
              data-gn-action="menu"
              type="button"
            >
              <svg aria-hidden="true" height="18" viewBox="0 0 18 18" width="18">
                <polyline fill="none" points="2 12, 16 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2">
                  <animate attributeName="points" begin="indefinite" calcMode="spline" data-bread="open" dur="0.24s" fill="freeze" keySplines="0.42, 0, 1, 1;0, 0, 0.58, 1" keyTimes="0;0.5;1" values=" 2 12, 16 12; 2 9, 16 9; 3.5 15, 15 3.5" />
                  <animate attributeName="points" begin="indefinite" calcMode="spline" data-bread="close" dur="0.24s" fill="freeze" keySplines="0.42, 0, 1, 1;0, 0, 0.58, 1" keyTimes="0;0.5;1" values=" 3.5 15, 15 3.5; 2 9, 16 9; 2 12, 16 12" />
                </polyline>
                <polyline fill="none" points="2 5, 16 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2">
                  <animate attributeName="points" begin="indefinite" calcMode="spline" data-bread="open" dur="0.24s" fill="freeze" keySplines="0.42, 0, 1, 1;0, 0, 0.58, 1" keyTimes="0;0.5;1" values=" 2 5, 16 5; 2 9, 16 9; 3.5 3.5, 15 15" />
                  <animate attributeName="points" begin="indefinite" calcMode="spline" data-bread="close" dur="0.24s" fill="freeze" keySplines="0.42, 0, 1, 1;0, 0, 0.58, 1" keyTimes="0;0.5;1" values=" 3.5 3.5, 15 15; 2 9, 16 9; 2 5, 16 5" />
                </polyline>
              </svg>
            </button>
          </div>
        </div>
      </nav>
      <div aria-hidden="true" className="globalnav-curtain" />
    </header>
  );
}
