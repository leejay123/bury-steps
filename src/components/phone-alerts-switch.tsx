"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/**
 * Opt in to a phone alert about an hour before a walk. The browser asks
 * permission; turning it off removes this device's subscription.
 */
export function PhoneAlertsSwitch({
  initiallyOn,
  vapidPublicKey,
}: {
  initiallyOn: boolean;
  vapidPublicKey: string | null;
}) {
  const [on, setOn] = useState(initiallyOn);
  const [pending, setPending] = useState(false);

  async function toggle(next: boolean) {
    if (pending) return;
    if (next && !vapidPublicKey) {
      toast.error("Phone alerts aren't set up on the site yet.");
      return;
    }
    if (next && (typeof Notification === "undefined" || !("serviceWorker" in navigator))) {
      toast.error("This browser can't show phone alerts.");
      return;
    }
    setOn(next);
    setPending(true);
    try {
      if (!next) {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const current = await registration?.pushManager.getSubscription();
        const endpoint = current?.endpoint;
        await current?.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(endpoint ? { endpoint } : {}),
        });
        toast.success("Phone alerts are off on this device.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setOn(false);
        toast.error("Allow notifications to get a walk alert.");
        return;
      }
      const registration = await navigator.serviceWorker.register("/serwist/sw.js", { scope: "/" });
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(vapidPublicKey!),
      });
      const json = subscription.toJSON();
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint, keys: json.keys }),
      });
      if (!response.ok) {
        setOn(false);
        toast.error("Could not turn phone alerts on. Try again.");
        return;
      }
      toast.success("You'll get an alert about an hour before a walk.");
    } catch {
      setOn(!next);
      toast.error("Could not change phone alerts. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-base font-medium">Phone</p>
      <label className="flex cursor-pointer items-start justify-between gap-4" htmlFor="phone-alerts">
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Walk starting soon</span>
          <span className="text-sm text-muted-foreground">
            A notification about an hour before a walk. On an iPhone, add the site to your Home
            Screen first. On Android or a computer, allow notifications in the browser.
          </span>
        </span>
        <Switch
          checked={on}
          className="mt-0.5"
          disabled={pending}
          id="phone-alerts"
          onCheckedChange={(checked) => void toggle(checked)}
        />
      </label>
    </div>
  );
}
