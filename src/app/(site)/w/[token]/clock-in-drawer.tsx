"use client";

import { useState } from "react";
import { ClockInForm } from "./clock-in-form";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

/**
 * "Clock in" as one button that opens the pre-walk check in a drawer, like
 * "Create a walk", instead of the whole form sitting on the walk page. On
 * success the page swaps to "You are clocked in", which closes the drawer.
 */
export function ClockInDrawer({
  compact = false,
  emergencyContactName = "",
  emergencyContactPhone = "",
  emergencyContactRequired = false,
  token,
}: {
  /** A normal-size button, for a bar or banner. */
  compact?: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRequired?: boolean;
  token: string;
}) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  return (
    <Drawer
      onOpenChange={(next) => {
        if (next) setSession((value) => value + 1);
        setOpen(next);
      }}
      open={open}
      variant="form"
    >
      <DrawerTrigger asChild>
        {/* The same size as the page's other buttons; full width on a phone. */}
        <Button className={compact ? "w-full sm:w-auto" : "w-full sm:w-auto sm:self-start"} size="sm" type="button">
          Clock in
        </Button>
      </DrawerTrigger>
      <DrawerContent className="min-h-0">
        <DrawerHeader>
          <DrawerTitle>Clock in</DrawerTitle>
          <DrawerDescription>A quick pre-walk check, then you&rsquo;re on the walk.</DrawerDescription>
        </DrawerHeader>
        {/* Padded and scrolling on its own, like Create a walk's drawer. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-4 pb-4">
          <ClockInForm
            emergencyContactName={emergencyContactName}
            emergencyContactPhone={emergencyContactPhone}
            emergencyContactRequired={emergencyContactRequired}
            key={session}
            token={token}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
