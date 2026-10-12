"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WalkIdeaParts } from "@/components/walk-idea-layouts";
import type { WalkDesigns } from "@/lib/walk-page-choice";

// The editor (and Puck) only loads when someone opens it.
const WalkDesignEditor = dynamic(() => import("./editor").then((mod) => mod.WalkDesignEditor), { ssr: false });

/**
 * The walk and its saved designs, for "Design this page". It's handed down
 * this way rather than to the button itself because the button sits in the
 * walk's Manage list, which is itself one of the walk's parts.
 */
const WalkDesignContext = createContext<{ designs: WalkDesigns; parts: WalkIdeaParts } | null>(null);

export function WalkDesignProvider({
  children,
  designs,
  parts,
}: {
  children: ReactNode;
  designs: WalkDesigns;
  parts: WalkIdeaParts;
}) {
  return <WalkDesignContext.Provider value={{ designs, parts }}>{children}</WalkDesignContext.Provider>;
}

/**
 * "Design this page", in the organiser walk page's Manage list: opens the
 * walk page designer over this walk. The designer is placed on the page
 * itself (a portal), since the Manage list keeps its buttons hidden.
 */
export function WalkDesignButton() {
  const value = useContext(WalkDesignContext);
  const [open, setOpen] = useState(false);
  if (!value) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" type="button" variant="outline">
        <Paintbrush data-icon="inline-start" />
        Design this page
      </Button>
      {open
        ? createPortal(
            <WalkDesignEditor designs={value.designs} onClose={() => setOpen(false)} parts={value.parts} />,
            document.body,
          )
        : null}
    </>
  );
}
