"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { setColorMode, useColorMode, type ColorMode } from "@/components/color-mode";

const OPTIONS: { mode: ColorMode; label: string; Icon: typeof Sun }[] = [
  { mode: "light", label: "Light", Icon: Sun },
  { mode: "dark", label: "Dark", Icon: Moon },
  { mode: "system", label: "System", Icon: Monitor },
];

/** The footer's light / dark / device switch, in shadcn.io's own look. */
export function FooterAppearance() {
  const current = useColorMode();
  return (
    <fieldset className="globalfooter-appearance">
      <legend className="sr-only">Appearance</legend>
      {OPTIONS.map(({ mode, label, Icon }) => (
        <button
          aria-label={label}
          aria-pressed={current === mode}
          className="globalfooter-appearance-option"
          key={mode}
          onClick={() => setColorMode(mode)}
          title={label}
          type="button"
        >
          <Icon aria-hidden />
        </button>
      ))}
    </fieldset>
  );
}
