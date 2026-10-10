"use client";

import { useId, useState, type ReactNode } from "react";
import { InlineScript } from "@/components/inline-script";

function readFlag(name: string): boolean {
  try {
    return new RegExp(`(?:^|; )${name}=1(?:;|$)`).test(document.cookie);
  } catch {
    return false;
  }
}

/**
 * A button only some people get (e.g. "Create a notice"), in a page part
 * that's the same for everyone. `known`: whether this person gets it, once
 * the page knows who they are. Before that, it shows if it did last time
 * in this browser (cookie `name`, written with RememberText) — on a
 * refresh, the script decides before anything is drawn (InlineScript), so
 * it never pops in a moment later.
 */
export function RememberedAction({
  name,
  known,
  className,
  children,
}: {
  name: string;
  known?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const [show] = useState<boolean>(() =>
    known !== undefined ? known : typeof window === "undefined" ? false : readFlag(name),
  );
  const script = `{var el=document.getElementById(${JSON.stringify(id)});if(el&&/(?:^|; )${name}=1(?:;|$)/.test(document.cookie))el.removeAttribute("hidden")}`;
  return (
    <>
      <div className={className} hidden={!show || undefined} id={id} suppressHydrationWarning>
        {children}
      </div>
      {known === undefined ? <InlineScript html={script} /> : null}
    </>
  );
}
