"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WalkIdeaParts } from "@/components/walk-idea-layouts";
import type { WalkDesigns } from "@/lib/walk-page-choice";

// The editor (and Puck) only loads when someone opens it.
const WalkDesignEditor = dynamic(() => import("./editor").then((mod) => mod.WalkDesignEditor), { ssr: false });

/** "Design this page" on the organiser walk page: opens the walk page designer over this walk. */
export function WalkDesignButton({ designs, parts }: { designs: WalkDesigns; parts: WalkIdeaParts }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" type="button" variant="outline">
        <Paintbrush data-icon="inline-start" />
        Design this page
      </Button>
      {open ? <WalkDesignEditor designs={designs} onClose={() => setOpen(false)} parts={parts} /> : null}
    </>
  );
}
