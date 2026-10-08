"use client";

import { useEffect } from "react";
import { AVATAR_COOKIE, BAR_COOKIE, NAV_COOKIE } from "@/lib/remembered-nav";
import { writeClientCookie } from "@/lib/remembered-rows-key";

function forget(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** Keeps the header cookie in step with the session, so the next refresh paints the same menu. */
export function RememberHeader({ initial }: { initial: string | null }) {
  useEffect(() => {
    if (initial) {
      writeClientCookie(AVATAR_COOKIE, encodeURIComponent(initial.slice(0, 1)));
      document.documentElement.setAttribute("data-remembered-in", "");
      return;
    }
    forget(NAV_COOKIE);
    forget(AVATAR_COOKIE);
    forget(BAR_COOKIE);
    document.documentElement.removeAttribute("data-remembered-in");
  }, [initial]);
  return null;
}
