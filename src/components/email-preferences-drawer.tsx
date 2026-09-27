"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { useActionToast } from "@/hooks/use-action-toast";
import { EMAIL_PREFERENCE_OPTIONS, type EmailPreferences } from "@/lib/email-preferences";
import { updateMyEmailPreferences, type ActionResult } from "@/server/actions";

const OPEN_EVENT = "email-preferences:open";

/** Opens the email preferences drawer from anywhere (account menu, links). */
export function openEmailPreferences() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

// Laid out like shadcn studio's Drawer 11 (settings drawer): headed sections
// of switches. Each switch saves straight away.
const SECTIONS: { heading: string; names: (keyof EmailPreferences)[] }[] = [
  { heading: "Walks", names: ["emailWalkAnnouncements", "emailProgress"] },
  { heading: "News", names: ["emailNotices", "emailNewsletter"] },
  { heading: "Organisers", names: ["emailAccidentAlerts"] },
];

export function EmailPreferencesDrawer({
  email,
  isAdmin,
  preferences,
}: {
  email: string;
  isAdmin: boolean;
  preferences: EmailPreferences;
}) {
  const [open, setOpen] = React.useState(false);
  const [prefs, setPrefs] = React.useState(preferences);
  const [state, action] = useActionState<ActionResult | null, FormData>(updateMyEmailPreferences, null);
  const [, startTransition] = useTransition();
  useActionToast(state);

  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  function toggle(name: keyof EmailPreferences, checked: boolean) {
    const next = { ...prefs, [name]: checked };
    setPrefs(next);
    const formData = new FormData();
    for (const [key, value] of Object.entries(next)) if (value) formData.set(key, "on");
    startTransition(() => action(formData));
  }

  const options = EMAIL_PREFERENCE_OPTIONS.filter((option) => !option.adminOnly || isAdmin);

  return (
    <Drawer direction="right" onOpenChange={setOpen} open={open}>
      <DrawerContent>
        <DrawerHeader className="border-b text-left">
          <DrawerTitle>Email preferences</DrawerTitle>
          <DrawerDescription>{email}</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain p-4">
          {SECTIONS.map((section) => {
            const rows = options.filter((option) => section.names.includes(option.name));
            if (rows.length === 0) return null;
            return (
              <div className="space-y-3" key={section.heading}>
                <p className="text-base font-medium">{section.heading}</p>
                <div className="space-y-3">
                  {rows.map((option) => {
                    const id = `email-pref-${option.name}`;
                    return (
                      <label className="flex cursor-pointer items-start justify-between gap-4" htmlFor={id} key={option.name}>
                        <span className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">{option.label}</span>
                          <span className="text-sm text-muted-foreground">{option.hint}</span>
                        </span>
                        <Switch
                          checked={prefs[option.name]}
                          className="mt-0.5"
                          id={id}
                          onCheckedChange={(checked) => toggle(option.name, checked)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
