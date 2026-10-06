"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { actionResultErrorMessage, safeServerAction } from "@/lib/action-errors";
import { PhoneAlertsSwitch } from "@/components/phone-alerts-switch";
import { EMAIL_PREFERENCE_OPTIONS, type EmailPreferences } from "@/lib/email-preferences";
import { updateMyEmailPreferences } from "@/server/actions";

// A failed save (offline, or a deploy mid-session) comes back as an error
// instead of throwing — thrown here, in the header, it took down the whole
// site to the bare error screen.
const savePreference = safeServerAction(updateMyEmailPreferences);

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
  phoneAlertsOn,
  preferences,
  vapidPublicKey,
}: {
  email: string;
  isAdmin: boolean;
  phoneAlertsOn: boolean;
  preferences: EmailPreferences;
  vapidPublicKey: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [prefs, setPrefs] = React.useState(preferences);
  const [, startTransition] = useTransition();
  // The header stays put across page changes, so take in the saved values
  // whenever they change (e.g. after saving on the Email preferences page).
  useResetOnChange(
    [
      preferences.emailAccidentAlerts,
      preferences.emailNewsletter,
      preferences.emailNotices,
      preferences.emailProgress,
      preferences.emailWalkAnnouncements,
    ],
    () => setPrefs(preferences),
  );

  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Saves just this switch, so it can't overwrite the others with an old
  // copy, and puts it back if the save fails.
  function toggle(name: keyof EmailPreferences, checked: boolean) {
    setPrefs((current) => ({ ...current, [name]: checked }));
    const formData = new FormData();
    formData.set("only", name);
    if (checked) formData.set(name, "on");
    startTransition(async () => {
      const result = await savePreference(null, formData);
      if (result.ok) {
        toast.success(result.message ?? "Saved.");
        router.refresh();
      } else {
        setPrefs((current) => ({ ...current, [name]: !checked }));
        toast.error(actionResultErrorMessage(result.error));
      }
    });
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
          <PhoneAlertsSwitch initiallyOn={phoneAlertsOn} vapidPublicKey={vapidPublicKey} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
