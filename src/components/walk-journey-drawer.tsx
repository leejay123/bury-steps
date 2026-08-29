"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { WalkJourneyTimeline } from "@/components/walk-journey-timeline";
import type { JourneyEventView } from "@/lib/walk-journey";

/** Opens the walk Journey in a drawer so the main page stays light. */
export function WalkJourneyDrawer({ events }: { events: JourneyEventView[] }) {
  const [open, setOpen] = useState(false);

  if (events.length === 0) return null;

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger asChild>
        <Button size="sm" variant="outline">
          View journey
        </Button>
      </DrawerTrigger>
      <DrawerContent className="sm:max-w-lg">
        <DrawerHeader className="shrink-0 border-b text-left">
          <DrawerTitle>Journey</DrawerTitle>
          <DrawerDescription>What happened on this walk.</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-5">
          <WalkJourneyTimeline events={events} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
