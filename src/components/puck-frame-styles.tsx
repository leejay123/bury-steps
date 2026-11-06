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
  }, [frame]);
  return <>{children}</>;
}
