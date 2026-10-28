"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { NAV_COOKIE, parseRememberedNav } from "@/lib/remembered-nav";
import { CustomizePanel } from "./customize-panel";
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

const isPhone = () => window.matchMedia("(max-width: 1023.98px)").matches;

type Open = { kind: "flyout"; id: string } | { kind: "menu"; sub: string | null } | null;

/**
 * shadcn.io's header (their "globalnav", used with their permission): the
 * logo, the menu with its drop-downs, search, Customize, the theme switch and
 * Sign in; on phones a full-screen menu with sub-menus. Their stylesheet does
 * the look and every animation; this adds and removes the same classes, in
 * the same order and with the same timings, as their own script does
 * (recorded from shadcn.io).
 */
export function GlobalNav({
  siteName,
  logoSrc,
  links,
  search,
  account,
  facebookUrl,
}: {
  siteName: string;
  logoSrc: string;
  /** The visitor's menu; a signed-in member's remembered menu replaces it. */
  links: GlobalNavLink[];
  search: SearchItem[];
  /** Sign in, or the bell, Dashboard and avatar (rendered on the server). */
  account: ReactNode;
  facebookUrl: string;
}) {
  const remembered = useRememberedMenu();
  const memberLinks = remembered ? parseRememberedNav(remembered) : [];
  const menu: NavSection[] = shortMenu(memberLinks.length ? memberLinks : links, facebookUrl);

  const navRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const breadRef = useRef<SVGSVGElement>(null);
  const searchRef = useRef<SearchPanelHandle>(null);
  const open = useRef<Open>(null);
  const timers = useRef<number[]>([]);
  const hover = useRef<number | null>(null);

  const el = (selector: string) => navRef.current?.querySelector<HTMLElement>(selector) ?? null;
  const li = (id: string) => el(`[data-gn-id="${id}"]`);
  const flyout = (id: string) => (id === "menu" ? el(".globalnav-menu-flyout") : el(`#globalnav-flyout-${id}`));
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const setNav = (...classes: string[]) => {
    if (navRef.current) navRef.current.className = ["globalnav", ...classes].join(" ");
  };
  const setItem = (id: string, ...classes: string[]) => {
    const item = li(id);
    if (!item) return;
    item.classList.remove(
      "globalnav-item-flyout-open",
      "globalnav-item-flyout-closing",
      "globalnav-item-flyout-change-previous",
      "globalnav-item-flyout-change-next",
    );
    item.classList.add(...classes);
  };
  const setCurtain = (state: "open" | "still" | "closed") => {
    const curtain = curtainRef.current;
    if (!curtain) return;
    curtain.className =
      state === "closed" ? "globalnav-curtain" : `globalnav-curtain globalnav-curtain-open${state === "still" ? " globalnav-curtain-still" : ""}`;
  };
  const wake = (id: string, on: boolean) => flyout(id)?.classList.toggle("globalnav-flyout-awake", on);
  const isSection = (id: string) => menu.some((section) => section.id === id);
  /** Their flyouts open to the height of what's inside, plus the bar. */
  const measure = (id: string) => {
    const fly = flyout(id);
    const content = fly?.querySelector<HTMLElement>(".globalnav-flyout-content");
    if (!fly || !content) return;
    fly.style.setProperty("--gn-flyout-height", `${content.offsetHeight + 56}px`);
    fly.style.setProperty("--gn-rate", "240ms");
  };
  const expand = (id: string | null) => {
    navRef.current?.querySelectorAll("[data-gn-toggle]").forEach((button) => {
      button.setAttribute("aria-expanded", String(button.getAttribute("data-gn-toggle") === id));
    });
  };
  const bread = (kind: "open" | "close") =>
    breadRef.current?.querySelectorAll<SVGAnimateElement>(`animate[data-bread="${kind}"]`).forEach((a) => a.beginElement());

  /** Open a drop-down, search or Customize (closing or switching from whatever is open). */
  const openFlyout = useCallback(
    (id: string) => {
      const current = open.current;
      if (current?.kind === "flyout" && current.id === id) return;
      clearTimers();
      const section = isSection(id) ? ["globalnav-with-submenu-open"] : [];
      wake(id, true);
      measure(id);
      expand(id);
      if (current?.kind === "flyout") {
        const previous = current.id;
        setItem(previous, "globalnav-item-flyout-change-previous", "globalnav-item-flyout-closing");
        setItem(id, "globalnav-item-flyout-change-next");
        setNav("globalnav-with-flyout-open", "globalnav-with-flyout-closing", "globalnav-animating", ...section);
        later(120, () => {
          setItem(previous);
          wake(previous, false);
          setItem(id, "globalnav-item-flyout-open");
          setNav("globalnav-with-flyout-open", "globalnav-animating", ...section);
        });
      } else {
        setItem(id, "globalnav-item-flyout-open");
        setNav("globalnav-with-flyout-open", "globalnav-animating", ...section);
        setCurtain("open");
      }
      open.current = { kind: "flyout", id };
      later(current?.kind === "flyout" ? 360 : 240, () => {
        setNav("globalnav-with-flyout-open", ...section);
        setCurtain("still");
      });
      if (id === "search") later(60, () => searchRef.current?.focus());
      // Phones: the menu button turns into ✕ to close the panel.
      if (!current && isPhone()) bread("open");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [remembered],
  );

  const closeFlyout = useCallback(() => {
    const current = open.current;
    if (current?.kind !== "flyout") return;
    clearTimers();
    setItem(current.id, "globalnav-item-flyout-closing");
    setNav("globalnav-with-flyout-closing", "globalnav-animating");
    setCurtain("closed");
    expand(null);
    open.current = null;
    if (isPhone()) bread("close");
    later(360, () => {
      setItem(current.id);
      wake(current.id, false);
      setNav();
      if (current.id === "search") searchRef.current?.reset();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** The phone menu: open, a sub-menu, back, and close, as recorded from shadcn.io. */
  const openMenu = () => {
    clearTimers();
    const top = Math.max(0, navRef.current?.getBoundingClientRect().top ?? 0);
    navRef.current?.style.setProperty("--gn-lift", `${top}px`);
    contentRef.current?.style.setProperty("--gn-rate", "422ms");
    wake("menu", true);
    setItem("menu", "globalnav-item-flyout-open");
    document.documentElement.classList.add("globalnav-noscroll");
    setNav("globalnav-with-flyout-open", "globalnav-animating", "globalnav-with-menu-open");
    setCurtain("open");
    bread("open");
    el(".globalnav-menutrigger-button")?.setAttribute("aria-expanded", "true");
    open.current = { kind: "menu", sub: null };
    later(424, () => {
      setNav("globalnav-with-flyout-open", "globalnav-with-menu-open");
      setCurtain("still");
    });
  };
  const openSub = (id: string) => {
    clearTimers();
    wake(id, true);
    setItem("menu", "globalnav-item-flyout-change-previous", "globalnav-item-flyout-closing");
    setItem(id, "globalnav-item-flyout-change-next");
    setNav(
      "globalnav-with-flyout-open",
      "globalnav-with-menu-open",
      "globalnav-with-flyout-closing",
      "globalnav-animating",
      "globalnav-with-submenu-open",
    );
    open.current = { kind: "menu", sub: id };
    later(406, () => {
      setItem(id, "globalnav-item-flyout-open");
      setItem("menu");
      setNav("globalnav-with-flyout-open", "globalnav-with-menu-open", "globalnav-with-submenu-open");
    });
  };
  const back = () => {
    const current = open.current;
    if (current?.kind !== "menu" || !current.sub) return;
    const sub = current.sub;
    clearTimers();
    setItem(sub, "globalnav-item-flyout-change-previous", "globalnav-item-flyout-closing");
    setItem("menu", "globalnav-item-flyout-change-next");
    setNav("globalnav-with-flyout-open", "globalnav-with-menu-open", "globalnav-with-flyout-closing", "globalnav-animating");
    open.current = { kind: "menu", sub: null };
    later(400, () => {
      setItem("menu", "globalnav-item-flyout-open");
      setItem(sub);
      wake(sub, false);
      setNav("globalnav-with-flyout-open", "globalnav-with-menu-open");
    });
  };
  const closeMenu = () => {
    const current = open.current;
    if (current?.kind !== "menu") return;
    clearTimers();
    if (current.sub) setItem(current.sub);
    setItem("menu", "globalnav-item-flyout-closing");
    document.documentElement.classList.remove("globalnav-noscroll");
    setNav("globalnav-with-flyout-closing", "globalnav-animating");
    setCurtain("closed");
    bread("close");
    el(".globalnav-menutrigger-button")?.setAttribute("aria-expanded", "false");
    open.current = null;
    later(503, () => {
      setItem("menu");
      wake("menu", false);
      if (current.sub) wake(current.sub, false);
      setNav();
    });
  };
  const closeAll = () => (open.current?.kind === "menu" ? closeMenu() : closeFlyout());

  // Escape closes; a search panel that grows or shrinks keeps its height right.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open.current) closeAll();
    };
    document.addEventListener("keydown", onKey);
    const observer = new ResizeObserver(() => {
      if (open.current?.kind === "flyout") measure(open.current.id);
    });
    navRef.current?.querySelectorAll(".globalnav-flyout-content").forEach((content) => observer.observe(content));
    return () => {
      document.removeEventListener("keydown", onKey);
      observer.disconnect();
      document.documentElement.classList.remove("globalnav-noscroll");
    };
  });

  const part = (i: number) => ({ "--gn-item": String(i) }) as React.CSSProperties;

  return (
    <header
      className="globalnav-header"
      data-slot="site-header"
      onMouseLeave={() => {
        if (hover.current) window.clearTimeout(hover.current);
        if (open.current?.kind === "flyout" && isSection(open.current.id) && !isPhone()) closeFlyout();
      }}
    >
      <nav aria-label="Global" className="globalnav" ref={navRef}>
        <div className="globalnav-content" ref={contentRef}>
          <div className="globalnav-item globalnav-menuback">
            <button aria-label="Main menu" className="globalnav-menuback-button" data-gn-action="back" onClick={back} type="button">
              <svg aria-hidden="true" height="48" viewBox="0 0 9 48" width="9">
                <path d="M7.6 17.2 1 24l6.6 6.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
              </svg>
            </button>
          </div>
          <ul className="globalnav-list" id="globalnav-list">
            <li className="globalnav-item globalnav-start" data-gn-id="start">
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
                        data-gn-kind="section"
                        key={section.id}
                        onMouseEnter={() => {
                          if (!hasFlyout || isPhone()) return;
                          if (hover.current) window.clearTimeout(hover.current);
                          hover.current = window.setTimeout(() => openFlyout(section.id), open.current ? 0 : 120);
                        }}
                        style={{ "--gn-item": String(i) } as React.CSSProperties}
                      >
                        <div className="globalnav-trigger">
                          <Link
                            className="globalnav-link"
                            data-gn-section={section.id}
                            href={section.href}
                            onClick={(event) => {
                              // Phones (as on shadcn.io and apple.com): a link with a drop-down opens it as a sub-menu.
                              if (hasFlyout && isPhone()) {
                                event.preventDefault();
                                openSub(section.id);
                                return;
                              }
                              closeAll();
                            }}
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
                              onClick={() =>
                                isPhone()
                                  ? openSub(section.id)
                                  : open.current?.kind === "flyout" && open.current.id === section.id
                                    ? closeFlyout()
                                    : openFlyout(section.id)
                              }
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
                                              <Link className="globalnav-group-link" href={link.href} onClick={closeAll}>
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
                    onClick={() => {
                      if (open.current?.kind === "flyout" && open.current.id === "search") closeFlyout();
                      else {
                        if (open.current?.kind === "menu") closeMenu();
                        openFlyout("search");
                      }
                    }}
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
                          <SearchPanel items={search} onGo={closeFlyout} ref={searchRef} siteName={siteName.split(" ").slice(0, 2).join(" ")} />
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
                    onClick={() =>
                      open.current?.kind === "flyout" && open.current.id === "customize" ? closeFlyout() : openFlyout("customize")
                    }
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
              onClick={() => {
                if (open.current?.kind === "menu") closeMenu();
                else if (open.current?.kind === "flyout") {
                  // As on shadcn.io: while search is open on a phone this button is a ✕ that closes it.
                  closeFlyout();
                } else openMenu();
              }}
              type="button"
            >
              <svg aria-hidden="true" height="18" ref={breadRef} viewBox="0 0 18 18" width="18">
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
      <div aria-hidden="true" className="globalnav-curtain" onClick={closeAll} ref={curtainRef} />
    </header>
  );
}
