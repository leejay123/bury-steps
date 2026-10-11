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
  emergencyContactName = "",
  emergencyContactPhone = "",
  emergencyContactRequired = false,
  token,
}: {
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
        <Button className="w-full sm:w-auto sm:min-w-48" size="lg" type="button">
          Clock in
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Clock in</DrawerTitle>
          <DrawerDescription>A quick pre-walk check, then you&rsquo;re on the walk.</DrawerDescription>
        </DrawerHeader>
        <ClockInForm
          emergencyContactName={emergencyContactName}
          emergencyContactPhone={emergencyContactPhone}
          emergencyContactRequired={emergencyContactRequired}
          key={session}
          token={token}
        />
      </DrawerContent>
    </Drawer>
  );
}
