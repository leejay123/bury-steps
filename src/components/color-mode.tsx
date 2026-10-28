"use client";

import { useSyncExternalStore } from "react";
import { ContrastIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_MODE_KEY as KEY, type ColorMode } from "@/lib/color-mode-script";

/**
 * Light and dark mode — only in the shadcn.io site design (Settings →
 * Branding → Site design), as on shadcn.io. Each visitor's choice (light,
 * dark, or their device's setting) is remembered in this browser and applied
 * to <html class="dark"> before the first paint (layout.tsx), so a refresh
 * never flashes the wrong colours.
 */

export type { ColorMode };

function readMode(): ColorMode {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "dark" || saved === "system") return saved;
  } catch {}
  // Light unless the visitor picks dark or "same as device".
  return "light";
}

function apply(mode: ColorMode) {
  const root = document.documentElement;
  const dark =
    root.getAttribute("data-design") === "shadcnio" &&
    (mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function setColorMode(mode: ColorMode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {}
  apply(mode);
  window.dispatchEvent(new Event("bs-color-mode"));
}

function subscribe(onChange: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  // "Same as device": follow the device when it switches.
  const onMedia = () => {
    apply(readMode());
    onChange();
  };
  // The design changing (Settings) turns dark mode on or off with it.
  const observer = new MutationObserver(() => apply(readMode()));
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-design"] });
  media.addEventListener("change", onMedia);
  window.addEventListener("bs-color-mode", onChange);
  window.addEventListener("storage", onMedia);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onMedia);
    window.removeEventListener("bs-color-mode", onChange);
    window.removeEventListener("storage", onMedia);
  };
}

/** The visitor's choice (the server draws "light", the default). */
export function useColorMode(): ColorMode {
  return useSyncExternalStore(subscribe, readMode, () => "light");
}

function isDarkNow() {
  return document.documentElement.classList.contains("dark");
}

/** The header's round switch: flips between light and dark. */
export function ColorModeToggle({ className }: { className?: string }) {
  useColorMode();
  return (
    <button
      aria-label="Toggle theme"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-foreground/80 transition-colors hover:text-foreground",
        className,
      )}
      data-color-mode-toggle=""
      onClick={() => setColorMode(isDarkNow() ? "light" : "dark")}
      type="button"
    >
      <ContrastIcon aria-hidden className="size-[18px]" strokeWidth={1.75} />
    </button>
  );
}

const MODES: { mode: ColorMode; label: string; Icon: typeof SunIcon }[] = [
  { mode: "light", label: "Light", Icon: SunIcon },
  { mode: "dark", label: "Dark", Icon: MoonIcon },
  { mode: "system", label: "Same as device", Icon: MonitorIcon },
];

/** The footer's three-way switch: light, dark, or the device's setting. */
export function ColorModeSwitch({ className }: { className?: string }) {
  const current = useColorMode();
  return (
    <div
      aria-label="Colour mode"
      className={cn("inline-flex items-center gap-0.5 rounded-full border p-0.5", className)}
      role="radiogroup"
    >
      {MODES.map(({ mode, label, Icon }) => (
        <button
          aria-checked={current === mode}
          aria-label={label}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground",
            current === mode && "bg-muted text-foreground",
          )}
          key={mode}
          onClick={() => setColorMode(mode)}
          role="radio"
          type="button"
        >
          <Icon aria-hidden className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
