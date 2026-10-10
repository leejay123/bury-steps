"use client";

import { useId, useState, type ReactNode } from "react";
import { InlineScript } from "@/components/inline-script";
import { rememberedRowsCookie } from "@/lib/remembered-rows-key";

function readText(name: string): string {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : "";
  } catch {
    return "";
  }
}

/**
 * A placeholder part sized by copy saved from the last visit (RememberText):
 * hidden when there's none, otherwise the saved words, invisible, so grey
 * bars over them wrap to the real height. Same two halves as RememberedRows:
 * the script fills it in on a refresh before anything is drawn, and a page
 * change reads the cookie directly. `children` wraps the words (the card).
 */
export function RememberedText({
  name,
  max = 500,
  className,
  children,
}: {
  /** Cookie written by RememberText. */
  name: string;
  max?: number;
  /** The card or line the words sit in; receives the words' slot. */
  className?: string;
  children: (words: ReactNode) => ReactNode;
}) {
  const id = useId();
  const [text] = useState(() => (typeof window === "undefined" ? "" : readText(name).slice(0, max)));
  const script = `{var m=document.cookie.match(/(?:^|; )${name}=([^;]*)/);var t="";try{t=m?decodeURIComponent(m[1]).slice(0,${max}):""}catch(e){}var el=document.getElementById(${JSON.stringify(id)});if(el){if(t){el.removeAttribute("hidden");var w=el.querySelectorAll("[data-sk-words]");for(var i=0;i<w.length;i++)w[i].textContent=t}else el.setAttribute("hidden","")}}`;
  return (
    <>
      <div className={className} hidden={!text || undefined} id={id} suppressHydrationWarning>
        {children(
          <span className="invisible" data-sk-words="" suppressHydrationWarning>
            {text}
          </span>,
        )}
      </div>
      <InlineScript html={script} />
    </>
  );
}

/**
 * " (9)" after a tab name: the count that list saved last time
 * (RememberListCount), on the first paint — nothing if it was never saved.
 * Same two halves as RememberedRows.
 */
export function RememberedCount({ remember, max = 10000 }: { remember: string; max?: number }) {
  const id = useId();
  const name = rememberedRowsCookie(remember);
  const [count] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const match = document.cookie.match(new RegExp(`(?:^|; )${name}=(\\d+)`));
      return match ? Math.min(Number(match[1]), max) : null;
    } catch {
      return null;
    }
  });
  const script = `{var m=document.cookie.match(/(?:^|; )${name}=(\\d+)/);var el=document.getElementById(${JSON.stringify(id)});if(el&&m)el.textContent=" ("+Math.min(+m[1],${max})+")"}`;
  return (
    <>
      <span id={id} suppressHydrationWarning>
        {count == null ? "" : ` (${count})`}
      </span>
      <InlineScript html={script} />
    </>
  );
}
