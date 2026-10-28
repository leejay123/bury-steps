/**
 * shadcn.io's header controller (their own script, ported with permission).
 * It owns every class on the nav, its items and the curtain: when a drop-down
 * opens, switches to another (passing both heights so the panel glides
 * between them), closes, and the phone menu with its sub-menus. The look and
 * the motion live in their stylesheet (shadcnio.css).
 */

type Phase = "closing" | "next" | "open" | "previous";
type Item = {
  content: HTMLElement | null;
  flyout: HTMLElement | null;
  hover: boolean;
  id: string;
  item: HTMLElement;
  lazy: boolean;
  pinned: boolean;
  scroll: HTMLElement | null;
  trigger: HTMLElement | null;
};

const rateFor = (height: number) => Math.min(480, Math.max(240, height / 2));
const PHASE_CLASSES: Record<Phase, string[]> = {
  closing: ["globalnav-item-flyout-closing"],
  next: ["globalnav-item-flyout-change-next"],
  open: ["globalnav-item-flyout-open"],
  previous: ["globalnav-item-flyout-change-previous", "globalnav-item-flyout-closing"],
};
const ALL_PHASES = [
  "globalnav-item-flyout-open",
  "globalnav-item-flyout-change-next",
  "globalnav-item-flyout-change-previous",
  "globalnav-item-flyout-closing",
];
const within = (path: string, href: string) => path === href || path.startsWith(`${href}/`);
/** A plain left click on a same-site link, which the header turns into an in-app navigation. */
const isPlainClick = (event: MouseEvent, link: HTMLAnchorElement) => {
  const href = link.getAttribute("href") ?? "";
  return (
    event.button === 0 &&
    !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) &&
    !link.target &&
    !link.hasAttribute("download") &&
    href.startsWith("/") &&
    !href.startsWith("//")
  );
};

export class GlobalnavController {
  nav: HTMLElement;
  options: { navigate: (href: string) => void; prefetch?: (href: string) => void };
  items = new Map<string, Item>();
  phases = new Map<string, Phase>();
  ends = new Map<string, number>();
  timers = new Set<number>();
  prefetched = new Set<string>();
  woken = new Set<string>();
  ready = new Set<string>();
  pending: string | null = null;
  listeners = new AbortController();
  media: MediaQueryList;
  content: HTMLElement | null;
  list: HTMLElement | null;
  menuButton: HTMLElement | null;
  curtain: HTMLElement | null;
  openListeners: AbortController | null = null;
  guardListener: AbortController | null = null;
  observer: ResizeObserver | null = null;
  menu = false;
  blocked = false;
  guard = true;
  usesTouch = false;
  hold = false;
  activeClick = false;
  delayed: string | null = null;
  hoverTimer = 0;

  constructor(nav: HTMLElement, options: GlobalnavController["options"]) {
    this.nav = nav;
    this.options = options;
    this.media = window.matchMedia("(max-width: 1023.98px)");
    this.content = nav.querySelector(".globalnav-content");
    this.list = nav.querySelector(".globalnav-list");
    this.menuButton = nav.querySelector('[data-gn-action="menu"]');
    this.curtain = nav.parentElement?.querySelector<HTMLElement>(":scope > .globalnav-curtain") ?? null;
    for (const item of nav.querySelectorAll<HTMLElement>("[data-gn-id]")) {
      const id = item.dataset.gnId ?? "";
      const flyout = item.querySelector<HTMLElement>(":scope > .globalnav-flyout, :scope > .globalnav-menu-flyout");
      this.items.set(id, {
        content: flyout?.querySelector<HTMLElement>(".globalnav-flyout-content") ?? null,
        flyout,
        hover: item.dataset.gnKind === "section",
        id,
        item,
        lazy: item.hasAttribute("data-gn-lazy"),
        pinned: item.hasAttribute("data-gn-pinned"),
        scroll: flyout?.querySelector<HTMLElement>(".globalnav-flyout-scroll") ?? null,
        trigger: item.querySelector<HTMLElement>(`[data-gn-toggle="${id}"]`),
      });
    }
    this.listen();
    this.armGuard();
  }

  destroy() {
    this.listeners.abort();
    this.openListeners?.abort();
    this.guardListener?.abort();
    this.observer?.disconnect();
    for (const t of this.timers) window.clearTimeout(t);
    document.documentElement.classList.remove("globalnav-noscroll");
  }

  route(path: string) {
    this.closeNow();
    this.guard = true;
    this.armGuard();
    for (const link of this.nav.querySelectorAll("a[data-gn-section]")) {
      if (within(path, link.getAttribute("href") ?? "")) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
    for (const link of this.nav.querySelectorAll("a.globalnav-group-link")) {
      if (link.getAttribute("href") === path) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
  }

  compact() {
    return this.media.matches;
  }

  current() {
    for (const [id, phase] of this.phases) if (phase === "open" || phase === "next") return id;
    return null;
  }

  pinnedOpen() {
    const id = this.current();
    return id !== null && (this.items.get(id)?.pinned ?? false);
  }

  setPhase(id: string, phase: Phase | null) {
    if (phase) this.phases.set(id, phase);
    else this.phases.delete(id);
    const item = this.items.get(id)?.item;
    if (!item) return;
    item.classList.remove(...ALL_PHASES);
    if (phase) item.classList.add(...PHASE_CLASSES[phase]);
  }

  sync() {
    const open = this.current();
    let closing = false;
    let submenu = false;
    for (const [id, phase] of this.phases) {
      closing ||= phase === "closing" || phase === "previous";
      submenu ||= (phase === "open" || phase === "next") && (this.items.get(id)?.hover ?? false);
    }
    const animating = this.ends.size > 0;
    const classes = this.nav.classList;
    classes.toggle("globalnav-with-flyout-open", open !== null);
    classes.toggle("globalnav-with-flyout-closing", closing);
    classes.toggle("globalnav-animating", animating);
    classes.toggle("globalnav-with-menu-open", this.menu);
    classes.toggle("globalnav-with-submenu-open", submenu);
    classes.toggle("globalnav-block-transitions", this.blocked);
    if (this.curtain) {
      const shown = open !== null && !this.pinnedOpen();
      const curtain = this.curtain.classList;
      curtain.toggle("globalnav-curtain-open", shown);
      curtain.toggle("globalnav-curtain-block", this.blocked);
      curtain.toggle("globalnav-curtain-still", (shown && !animating) || (this.menu && closing && animating));
    }
    for (const { id, trigger } of this.items.values()) trigger?.setAttribute("aria-expanded", String(open === id));
    if (this.menuButton) {
      this.menuButton.setAttribute("aria-expanded", String(this.menu));
      this.menuButton.setAttribute("aria-label", this.menu || open ? "Close" : "Menu");
    }
    this.watchOpen(open !== null);
  }

  later(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
    return id;
  }

  settle(id: string, ms: number, fn: () => void) {
    this.cancelEnd(id);
    const timer = this.later(() => {
      this.ends.delete(id);
      fn();
    }, ms);
    this.ends.set(id, timer);
  }

  cancelEnd(id: string) {
    const timer = this.ends.get(id);
    if (!timer) return;
    window.clearTimeout(timer);
    this.timers.delete(timer);
    this.ends.delete(id);
  }

  emit(id: string, name: string) {
    this.items.get(id)?.item.dispatchEvent(new CustomEvent(`globalnav:${name}`));
  }

  wake(id: string) {
    if (this.woken.has(id)) return;
    this.woken.add(id);
    this.items.get(id)?.flyout?.classList.add("globalnav-flyout-awake");
    this.emit(id, "wake");
  }

  barHeight() {
    return Number.parseInt(getComputedStyle(this.nav).getPropertyValue("--gn-height"), 10) || 0;
  }

  measure(id: string) {
    this.wake(id);
    if (this.compact()) {
      this.content?.style.setProperty("--gn-rate", `${rateFor(window.innerHeight)}ms`);
      return;
    }
    const item = this.items.get(id);
    if (!(item?.flyout && item.content)) return;
    const height = Math.floor(item.content.getBoundingClientRect().height);
    item.flyout.style.setProperty("--gn-flyout-height", `${height + this.barHeight()}px`);
    item.flyout.style.setProperty("--gn-rate", `${rateFor(height)}ms`);
    if (this.phases.get(id) === "open")
      item.flyout.classList.toggle("globalnav-flyout-short", window.innerHeight - 88 < height + this.barHeight());
  }

  rateOf(id: string) {
    const el = this.compact() ? this.content : this.items.get(id)?.flyout;
    return Number.parseFloat(el?.style.getPropertyValue("--gn-rate") ?? "") || 240;
  }

  heightOf(id: string) {
    return this.items.get(id)?.flyout?.style.getPropertyValue("--gn-flyout-height") || "0px";
  }

  observe(id: string | null) {
    this.observer?.disconnect();
    this.observer = null;
    const content = id ? this.items.get(id)?.content : null;
    if (id && content && typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => this.measure(id));
      this.observer.observe(content);
    }
  }

  bread(kind: "open" | "close") {
    for (const a of this.nav.querySelectorAll<SVGAnimateElement>(`[data-bread="${kind}"]`)) a.beginElement();
  }

  lockScroll(on: boolean) {
    document.documentElement.classList.toggle("globalnav-noscroll", on);
  }

  willOpen(id: string, switching: boolean) {
    this.setPhase(id, switching ? "next" : "open");
    this.emit(id, "willopen");
    if (!this.compact()) {
      this.observe(id);
      return;
    }
    if (!(this.menu || switching)) this.bread("open");
    if (!switching) {
      const { top } = this.nav.getBoundingClientRect();
      this.nav.style.setProperty("--gn-lift", `${Math.max(0, top)}px`);
      this.lockScroll(true);
    }
  }

  willClose(id: string, switching: boolean) {
    this.setPhase(id, switching ? "previous" : "closing");
    if (switching) return;
    this.items.get(id)?.flyout?.classList.remove("globalnav-flyout-short");
    this.bread("close");
    if (this.compact()) this.lockScroll(false);
  }

  onOpen(id: string, switching: boolean) {
    if (switching && this.phases.get(id) === "next") this.setPhase(id, "open");
    if (!this.compact()) {
      const height = Number.parseInt(this.heightOf(id), 10);
      this.items.get(id)?.flyout?.classList.toggle("globalnav-flyout-short", window.innerHeight - 88 < height);
    }
    this.activeClick = false;
    this.emit(id, "open");
    this.sync();
    const { delayed } = this;
    if (delayed && delayed !== id) {
      this.delayed = null;
      this.openFlyout(delayed);
    }
  }

  onClose(id: string) {
    const phase = this.phases.get(id);
    if (phase === "closing" || phase === "previous") this.setPhase(id, null);
    const scroll = this.items.get(id)?.scroll;
    if (scroll) scroll.scrollTop = 0;
    this.activeClick = false;
    this.emit(id, "close");
    if (!this.current()) this.observe(null);
    this.sync();
    const { delayed } = this;
    if (delayed) {
      this.delayed = null;
      this.openFlyout(delayed);
    }
  }

  openFlyout(id: string) {
    const was = this.current();
    if (was === id || !this.items.has(id)) return;
    for (const [other, phase] of this.phases) if (phase === "previous") this.setPhase(other, null);
    this.measure(id);
    if (was) {
      this.nav.style.setProperty("--gn-next-height", this.heightOf(id));
      this.nav.style.setProperty("--gn-previous-height", this.heightOf(was));
      this.cancelEnd(was);
      this.willClose(was, true);
      this.willOpen(id, true);
      this.settle(id, this.compact() ? 400 : 120, () => {
        this.onOpen(id, true);
        this.onClose(was);
      });
    } else {
      this.willOpen(id, false);
      this.settle(id, this.rateOf(id), () => this.onOpen(id, false));
    }
    this.sync();
  }

  closeFlyout(id: string | null = this.current()) {
    if (!id || id !== this.current()) return;
    this.willClose(id, false);
    const pause = this.compact() ? 80 : 120;
    this.settle(id, pause + this.rateOf(id), () => this.onClose(id));
    this.sync();
  }

  openMenu() {
    this.openFlyout("menu");
    this.menu = true;
    this.sync();
  }

  closeMenu() {
    this.menu = false;
    this.closeFlyout();
  }

  closeNow() {
    for (const t of this.ends.values()) {
      window.clearTimeout(t);
      this.timers.delete(t);
    }
    this.ends.clear();
    window.clearTimeout(this.hoverTimer);
    const anything = this.phases.size > 0 || this.menu;
    for (const id of [...this.phases.keys()]) {
      this.emit(id, "close");
      this.setPhase(id, null);
    }
    this.menu = false;
    this.delayed = null;
    this.pending = null;
    this.activeClick = false;
    this.hold = false;
    this.lockScroll(false);
    if (anything) {
      this.bread("close");
      this.blocked = true;
      this.sync();
      requestAnimationFrame(() => {
        this.blocked = false;
        this.sync();
      });
    }
  }

  dismiss() {
    this.closeNow();
    this.guard = true;
    this.armGuard();
  }

  toggle(id: string) {
    const isOpen = this.current() === id;
    const item = this.items.get(id);
    if (!isOpen && item?.lazy && !this.ready.has(id)) {
      this.wake(id);
      this.pending = id;
      this.later(() => this.openPending(id), 600);
      return;
    }
    if (this.ends.size > 0 && item && !item.hover) {
      this.delayed = isOpen ? null : id;
      if (isOpen) this.closeFlyout(id);
      return;
    }
    if (isOpen) this.closeFlyout(id);
    else this.openFlyout(id);
  }

  isOpen(id: string) {
    return this.current() === id;
  }

  openPending(id: string) {
    if (this.pending !== id) return;
    this.pending = null;
    this.ready.add(id);
    this.toggle(id);
  }

  armGuard() {
    if (this.guardListener) return;
    this.guardListener = new AbortController();
    document.addEventListener(
      "mousemove",
      (event) => {
        if (!(this.list && event.target instanceof Node && this.list.contains(event.target))) this.liftGuard();
      },
      { passive: true, signal: this.guardListener.signal },
    );
  }

  liftGuard() {
    this.guard = false;
    this.guardListener?.abort();
    this.guardListener = null;
  }

  watchOpen(open: boolean) {
    if (!open) {
      this.openListeners?.abort();
      this.openListeners = null;
      return;
    }
    if (this.openListeners) return;
    this.openListeners = new AbortController();
    const { signal } = this.openListeners;
    document.addEventListener("keydown", (event) => this.onKey(event), { signal });
    window.addEventListener("scroll", (event) => this.onScroll(event), { capture: true, passive: true, signal });
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (this.pinnedOpen() && event.target instanceof Node && !this.nav.contains(event.target)) this.closeFlyout();
      },
      { signal },
    );
  }

  onKey(event: KeyboardEvent) {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    if (this.menu) {
      event.preventDefault();
      this.closeMenu();
      this.later(() => this.menuButton?.focus(), 300);
      return;
    }
    const id = this.current();
    if (!id) return;
    const item = this.items.get(id);
    const focused = document.activeElement;
    this.closeFlyout(id);
    if (item?.flyout && focused && item.flyout.contains(focused)) this.later(() => item.trigger?.focus(), 300);
  }

  onScroll(event: Event) {
    if (this.compact() || this.usesTouch || this.pinnedOpen()) return;
    if (event.target instanceof Node && this.nav.contains(event.target)) return;
    this.closeFlyout();
  }

  listen() {
    const { signal } = this.listeners;
    const { nav } = this;
    this.media.addEventListener("change", () => this.closeNow(), { signal });
    this.list?.addEventListener("mouseover", (event) => this.onOver(event), { signal });
    this.list?.addEventListener("mouseout", () => this.liftGuard(), { signal });
    this.list?.addEventListener(
      "touchstart",
      () => {
        this.usesTouch = true;
      },
      { passive: true, signal },
    );
    nav.addEventListener(
      "mouseleave",
      () => {
        window.clearTimeout(this.hoverTimer);
        if (!(this.compact() || this.hold || this.usesTouch || this.pinnedOpen())) this.closeFlyout();
      },
      { signal },
    );
    nav.addEventListener(
      "focusout",
      (event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && next !== document.documentElement && !nav.contains(next) && this.current() && !this.menu)
          this.closeFlyout();
      },
      { signal },
    );
    const wakeToggle = (event: Event) => {
      const toggle = (event.target as Element | null)?.closest<HTMLElement>("[data-gn-toggle]");
      const id = toggle?.dataset.gnToggle;
      if (id && !this.items.get(id)?.hover) this.wake(id);
    };
    nav.addEventListener("pointerover", wakeToggle, { signal });
    nav.addEventListener("focusin", wakeToggle, { signal });
    nav.addEventListener("pointerdown", (event) => this.onSectionPress(event), { signal });
    nav.addEventListener("click", (event) => this.onClick(event), { signal });
    nav.addEventListener(
      "globalnav:hold",
      (event) => {
        this.hold = Boolean((event as CustomEvent).detail);
      },
      { signal },
    );
    nav.addEventListener("globalnav:dismiss", () => this.dismiss(), { signal });
    nav.addEventListener("globalnav:toggle", (event) => this.toggle(String((event as CustomEvent).detail)), { signal });
    nav.addEventListener(
      "mousemove",
      (event) => {
        if (this.hold && (event.target as Element | null)?.closest(".globalnav-flyout")) this.hold = false;
      },
      { passive: true, signal },
    );
    this.curtain?.addEventListener(
      "click",
      () => {
        if (this.menu) this.closeMenu();
        else this.closeFlyout();
      },
      { signal },
    );
  }

  onOver(event: MouseEvent) {
    const target = event.target as Element | null;
    const href = target?.closest("a[href^='/']")?.getAttribute("href");
    if (href && this.options.prefetch && !this.prefetched.has(href)) {
      this.prefetched.add(href);
      this.options.prefetch(href);
    }
    if (this.compact() || this.usesTouch || this.guard) return;
    const id = target?.closest<HTMLElement>("[data-gn-id]")?.dataset.gnId;
    window.clearTimeout(this.hoverTimer);
    if (id && this.items.get(id)?.hover) this.wake(id);
    this.hoverTimer = this.later(() => {
      const open = this.current();
      if (!id || id === open || id === "menu" || this.pinnedOpen()) return;
      if (this.items.get(id)?.hover) this.openFlyout(id);
      else this.closeFlyout(open);
    }, 120);
  }

  onSectionPress(event: PointerEvent) {
    const link = (event.target as Element | null)?.closest<HTMLElement>("[data-gn-section]");
    if (!link) return;
    const id = link.dataset.gnSection ?? "";
    if ((this.compact() || this.usesTouch || event.pointerType === "touch") && this.current() !== id)
      link.setAttribute("data-prevent-progress", "true");
    else link.removeAttribute("data-prevent-progress");
  }

  onClick(event: MouseEvent) {
    const target = event.target as Element | null;
    const action = target?.closest<HTMLElement>("[data-gn-action]");
    if (action) {
      if (action.dataset.gnAction === "menu") this.onMenuButton();
      else {
        this.activeClick = true;
        this.openFlyout("menu");
      }
      return;
    }
    const toggle = target?.closest<HTMLElement>("[data-gn-toggle]");
    if (toggle) {
      event.preventDefault();
      this.toggle(toggle.dataset.gnToggle ?? "");
      return;
    }
    const link = target?.closest<HTMLAnchorElement>("a[href]");
    if (!link) return;
    const section = link.dataset.gnSection;
    if (section && this.onSection(event, section)) return;
    if (!event.defaultPrevented && isPlainClick(event, link)) {
      event.preventDefault();
      this.dismiss();
      this.options.navigate(link.getAttribute("href") ?? "/");
    }
  }

  onSection(event: MouseEvent, id: string) {
    if (this.compact()) {
      if (this.activeClick) {
        event.preventDefault();
        return true;
      }
      if (this.current() === id) return false;
      // Only sections with a drop-down open one; the rest are plain links.
      if (!this.items.get(id)?.flyout) return false;
      event.preventDefault();
      this.activeClick = true;
      this.openFlyout(id);
      return true;
    }
    if (!this.usesTouch || this.current() === id || !this.items.get(id)?.flyout) return false;
    event.preventDefault();
    this.openFlyout(id);
    return true;
  }

  onMenuButton() {
    if (this.activeClick) return;
    this.activeClick = true;
    if (this.menu) this.closeMenu();
    else if (this.current()) this.closeFlyout();
    else this.openMenu();
  }
}
