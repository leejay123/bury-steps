import type { ReactNode } from "react";

/**
 * A settings page's placeholder: its real form, drawn with stand-in values
 * and every box, switch, button and picture shown as a grey shape (see
 * [data-sk-mask] in globals.css), so it's exactly the shape of the page that
 * replaces it. Labels and explanations stay readable — they're the same for
 * everyone. It can't be clicked or tabbed to (inert) and screen readers skip
 * it (aria-hidden).
 */
export function SettingsMask({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden className="flex flex-col gap-8" data-page-loading="" data-sk-mask="" inert>
      {children}
    </div>
  );
}
