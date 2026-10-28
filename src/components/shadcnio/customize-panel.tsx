"use client";

import { useState, useSyncExternalStore } from "react";
import { Braces, Clipboard } from "lucide-react";
import {
  BASES,
  CUSTOMIZE_KEY,
  DEFAULT_CUSTOMIZE,
  RADII,
  STYLES,
  THEMES,
  decodePreset,
  encodePreset,
  type Customize,
} from "@/lib/shadcnio-customize";

// Swatch colours as on shadcn.io (written out so Tailwind keeps them).
const THEME_SWATCH: Record<string, string> = {
  neutral: "bg-neutral-800",
  red: "bg-red-600",
  orange: "bg-orange-600",
  amber: "bg-amber-600",
  yellow: "bg-yellow-600",
  lime: "bg-lime-600",
  green: "bg-green-600",
  emerald: "bg-emerald-600",
  teal: "bg-teal-600",
  cyan: "bg-cyan-600",
  sky: "bg-sky-600",
  blue: "bg-blue-600",
  indigo: "bg-indigo-600",
  violet: "bg-violet-600",
  purple: "bg-purple-600",
  fuchsia: "bg-fuchsia-600",
  pink: "bg-pink-600",
  rose: "bg-rose-600",
};
const BASE_SWATCH: Record<string, string> = {
  zinc: "bg-zinc-500",
  neutral: "bg-neutral-500",
  stone: "bg-stone-500",
  mauve: "bg-mauve-500",
  olive: "bg-olive-500",
  mist: "bg-mist-500",
  taupe: "bg-taupe-500",
};
const SWATCH = "rounded-[calc(var(--radius)*100)] block shrink-0 border border-foreground/15 size-full";
const SMALL_BUTTON =
  "transition-none flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40";

function read(): string {
  try {
    return localStorage.getItem(CUSTOMIZE_KEY) ?? "";
  } catch {
    return "";
  }
}
const listeners = new Set<() => void>();

function useCustomize(): Customize {
  const raw = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    read,
    () => "",
  );
  try {
    return { ...DEFAULT_CUSTOMIZE, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return DEFAULT_CUSTOMIZE;
  }
}

function save(next: Customize) {
  try {
    localStorage.setItem(CUSTOMIZE_KEY, JSON.stringify(next));
  } catch {}
  const root = document.documentElement;
  (Object.keys(next) as (keyof Customize)[]).forEach((key) => root.setAttribute(`data-sc-${key}`, next[key]));
  listeners.forEach((listener) => listener());
}

function cssFor(choice: Customize) {
  return `:root {\n  /* Bury Steps — shadcn.io design: theme ${choice.theme}, base ${choice.base}, style ${choice.style}, radius ${choice.radius} */\n  --preset: ${encodePreset(choice)};\n}`;
}

/** shadcn.io's Customize panel: theme, base, style, radius and a preset code, for this browser. */
export function CustomizePanel() {
  const choice = useCustomize();
  const [code, setCode] = useState<string | null>(null);
  const style = STYLES.find((s) => s.id === choice.style) ?? STYLES[0];
  const changed = encodePreset(choice) !== encodePreset(DEFAULT_CUSTOMIZE);
  const set = (patch: Partial<Customize>) => {
    setCode(null);
    save({ ...choice, ...patch });
  };
  const part = (i: number) => ({ "--gn-item": String(i) }) as React.CSSProperties;

  return (
    <div className="globalnav-customize">
      <fieldset className="globalnav-customize-group">
        <legend className="globalnav-group-header globalnav-flyout-part" style={part(0)}>
          Theme
        </legend>
        <div className="globalnav-customize-swatches globalnav-flyout-part" style={part(1)}>
          {THEMES.map((theme) => (
            <button
              aria-label={theme[0]!.toUpperCase() + theme.slice(1)}
              aria-pressed={choice.theme === theme}
              className="globalnav-customize-swatch"
              data-kind="theme"
              data-value={theme}
              key={theme}
              onClick={() => set({ theme })}
              title={theme[0]!.toUpperCase() + theme.slice(1)}
              type="button"
            >
              <span aria-hidden="true" className={`${SWATCH} ${THEME_SWATCH[theme]}`} />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="globalnav-customize-group">
        <legend className="globalnav-group-header globalnav-flyout-part" style={part(0)}>
          Base
        </legend>
        <div className="globalnav-customize-swatches globalnav-customize-swatches-base globalnav-flyout-part" style={part(1)}>
          {BASES.map((base) => (
            <button
              aria-label={base[0]!.toUpperCase() + base.slice(1)}
              aria-pressed={choice.base === base}
              className="globalnav-customize-swatch"
              data-value={base}
              key={base}
              onClick={() => set({ base })}
              title={base[0]!.toUpperCase() + base.slice(1)}
              type="button"
            >
              <span aria-hidden="true" className={`${SWATCH} ${BASE_SWATCH[base]}`} />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="globalnav-customize-group">
        <legend className="globalnav-group-header globalnav-flyout-part" style={part(0)}>
          Style
        </legend>
        <div className="globalnav-customize-styles globalnav-flyout-part" style={part(1)}>
          {STYLES.map((s) => (
            <button
              aria-describedby={choice.style === s.id ? "globalnav-customize-style-note" : undefined}
              aria-pressed={choice.style === s.id}
              className="globalnav-customize-option"
              data-value={s.id}
              key={s.id}
              onClick={() => set({ style: s.id })}
              type="button"
            >
              {s.id[0]!.toUpperCase() + s.id.slice(1)}
            </button>
          ))}
        </div>
        <p className="globalnav-customize-note globalnav-flyout-part" id="globalnav-customize-style-note" style={part(2)}>
          {style.note}
        </p>
      </fieldset>
      <fieldset className="globalnav-customize-group">
        <legend className="globalnav-group-header globalnav-flyout-part" style={part(0)}>
          Radius
        </legend>
        <div className="globalnav-customize-radii globalnav-flyout-part" style={part(1)}>
          {RADII.map((r) => (
            <button
              aria-label={`Radius: ${r.label}`}
              aria-pressed={choice.radius === r.id}
              className="globalnav-customize-radius"
              data-kind="radius"
              data-value={r.id}
              key={r.id}
              onClick={() => set({ radius: r.id })}
              title={r.label}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`globalnav-customize-corner${r.id === "default" ? " border-dashed" : ""}`}
                style={{ borderRadius: `${r.preview}px` }}
              />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="globalnav-customize-group">
        <h3 className="globalnav-group-header globalnav-flyout-part" style={part(0)}>
          Preset
        </h3>
        <div className="globalnav-customize-code globalnav-flyout-part" style={part(1)}>
          <label
            className="me-1 flex h-8 min-w-0 flex-1 cursor-text items-center gap-1.5 rounded-md bg-muted/60 px-2.5 font-mono text-xs focus-within:bg-background hover:bg-muted focus-within:ring-2 focus-within:ring-ring"
            title="Paste a preset code to apply it"
          >
            <span aria-hidden="true" className="shrink-0 select-none text-muted-foreground">
              --preset
            </span>
            <input
              aria-label="Preset code"
              autoCapitalize="off"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/60"
              enterKeyHint="done"
              onChange={(event) => {
                setCode(event.target.value);
                const decoded = decodePreset(event.target.value);
                if (decoded) save(decoded);
              }}
              placeholder="paste a code"
              spellCheck={false}
              value={code ?? encodePreset(choice)}
            />
          </label>
          <button
            aria-label="Copy CSS"
            className={SMALL_BUTTON}
            onClick={() => void navigator.clipboard?.writeText(cssFor(choice))}
            title="Copy CSS"
            type="button"
          >
            <Braces aria-hidden className="size-3.5" />
          </button>
          <button
            aria-label="Copy preset"
            className={SMALL_BUTTON}
            onClick={() => void navigator.clipboard?.writeText(encodePreset(choice))}
            title="Copy preset"
            type="button"
          >
            <Clipboard aria-hidden className="size-3.5" />
          </button>
        </div>
        <div className="globalnav-customize-actions globalnav-flyout-part" style={part(2)}>
          <button
            className="globalnav-customize-option"
            onClick={() =>
              set({
                theme: THEMES[Math.floor(Math.random() * THEMES.length)]!,
                base: BASES[Math.floor(Math.random() * BASES.length)]!,
                style: STYLES[Math.floor(Math.random() * STYLES.length)]!.id,
                radius: RADII[Math.floor(Math.random() * RADII.length)]!.id,
              })
            }
            type="button"
          >
            Shuffle
          </button>
          {changed ? (
            <button className="globalnav-customize-option" onClick={() => set(DEFAULT_CUSTOMIZE)} type="button">
              Reset
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
