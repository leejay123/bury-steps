"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddNoticeForm } from "@/app/admin/settings/notice-manager/notice-form";
import type { NoticeCategoryView } from "@/lib/notices";
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
 * "Create a notice" on the Notices page, like "Create a walk" on Walks:
 * the same form as Settings → Notices → Add notice, in a drawer. Saving
 * refreshes the list (the save itself checks the Notices permission).
 */
export function CreateNoticeDrawer({ categories }: { categories: NoticeCategoryView[] }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [isPending, setIsPending] = useState(false);

  return (
    <Drawer
      closeDisabled={isPending}
      onOpenChange={(next) => {
        if (next) setSession((value) => value + 1);
        setOpen(next);
      }}
      open={open}
      variant="form"
    >
      <DrawerTrigger asChild>
        <Button className="w-full sm:w-auto" type="button">
          <Plus data-icon="inline-start" />
          Create a notice
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add a notice</DrawerTitle>
          <DrawerDescription>Members see it in the bell; a full page also appears on Notices.</DrawerDescription>
        </DrawerHeader>
        <AddNoticeForm
          categories={categories}
          disabled={false}
          key={session}
          onPendingChange={setIsPending}
          onSaved={() => setOpen(false)}
        />
      </DrawerContent>
    </Drawer>
  );
}
