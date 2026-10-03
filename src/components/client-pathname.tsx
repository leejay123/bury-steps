"use client";

import { createContext, Suspense, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * The current page's path, for site-wide parts that only need it in the
 * browser (page animations, scroll-to-top, which pages show the
 * announcement).
 *
 * Reading usePathname() straight in the root layout's parts makes every
 * page with a changing address (a notice, an invite link…) impossible to
 * ready-make in advance (Next.js Cache Components), because the ready-made
 * copy is shared by every address. Here only a tiny invisible watcher reads
 * it, in its own Suspense, and passes it on; until it's known this is null.
 */
const PathnameContext = createContext<string | null>(null);

export function ClientPathnameProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState<string | null>(null);
  return (
    <PathnameContext value={pathname}>
      <Suspense fallback={null}>
        <PathnameWatcher onChange={setPathname} />
      </Suspense>
      {children}
    </PathnameContext>
  );
}

function PathnameWatcher({ onChange }: { onChange: (pathname: string) => void }) {
  const pathname = usePathname();
  useLayoutEffect(() => {
    onChange(pathname);
  }, [onChange, pathname]);
  return null;
}

/** The current path once known in the browser; null before that. */
export function useClientPathname() {
  return useContext(PathnameContext);
}
