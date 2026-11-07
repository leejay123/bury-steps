"use client";

import { useEffect, type ReactNode } from "react";

/**
 * The preview frame gets the page's styles as text too. Puck copies the page's stylesheet
 * links into its frame and waits for them to load there; in Firefox on the live site they
 * didn't, so the preview showed with no styles at all (unstyled text, and the page's +
 * guide marks as a giant black cross). These copies come from the stylesheets the page has
 * already loaded, so they need nothing more from the network.
 * Put first, so Puck's own copies (when they load) still win; the rules are the same.
 */
export function PuckFrameStyles({
  children,
  document: frame,
}: {
  children: ReactNode;
  document?: Document;
}) {
  useEffect(() => {
    if (!frame) return;
    for (const sheet of Array.from(window.document.styleSheets)) {
      const owner = sheet.ownerNode;
      if (!(owner instanceof HTMLLinkElement)) continue;
      const key = owner.href;
      if (Array.from(frame.head.querySelectorAll("style[data-bs-copy]")).some((el) => el.getAttribute("data-bs-copy") === key)) continue;
      let text = "";
      try {
        text = Array.from(sheet.cssRules, (rule) => rule.cssText).join("\n");
      } catch {
        continue;
      }
      const style = frame.createElement("style");
      style.setAttribute("data-bs-copy", key);
      style.textContent = text;
      frame.head.prepend(style);
    }
    // The designer's marks on the page: Puck tints a block blue under the pointer, which
    // hid the page being designed. A thin outline instead, and a clear one once selected.
    if (!frame.head.querySelector("style[data-bs-designer]")) {
      const marks = frame.createElement("style");
      marks.setAttribute("data-bs-designer", "");
      marks.textContent = `:root {
  --puck-color-selection-bg: transparent;
  --puck-color-selection-border: color-mix(in srgb, #2563eb 45%, transparent);
  --puck-slot-component-color-border-selected: #2563eb;
  --puck-slot-component-border-width: 1.5px;
}`;
      frame.head.append(marks);
    }
  }, [frame]);
  return <>{children}</>;
}
