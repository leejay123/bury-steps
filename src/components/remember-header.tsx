"use client";

import { useEffect } from "react";
import { AVATAR_COOKIE, AVATAR_IMAGE_COOKIE, BAR_COOKIE, MORE_COOKIE, NAV_COOKIE, SEARCH_COOKIE } from "@/lib/remembered-nav";
import { writeClientCookie } from "@/lib/remembered-rows-key";

function forget(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** Keeps the header cookie in step with the session, so the next refresh paints the same menu. */
export function RememberHeader({ initial, search = false }: { initial: string | null; search?: boolean }) {
  useEffect(() => {
    if (initial) {
      writeClientCookie(AVATAR_COOKIE, encodeURIComponent(initial.slice(0, 1)));
      if (search) writeClientCookie(SEARCH_COOKIE, "1");
      else forget(SEARCH_COOKIE);
      document.documentElement.setAttribute("data-remembered-in", "");
      return;
    }
    forget(NAV_COOKIE);
    forget(AVATAR_COOKIE);
    forget(AVATAR_IMAGE_COOKIE);
    forget(BAR_COOKIE);
    forget(MORE_COOKIE);
    forget(SEARCH_COOKIE);
    document.documentElement.removeAttribute("data-remembered-in");
  }, [initial, search]);
  return null;
}
