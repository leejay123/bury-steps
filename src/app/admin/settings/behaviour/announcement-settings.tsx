"use client";

import { startTransition, useActionState, useState } from "react";
import { updateAnnouncementBanner, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FieldHint } from "@/components/drawer-form";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSection } from "../settings-page";

function Submit({ disabled, pending }: { disabled: boolean; pending: boolean }) {
  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function AnnouncementSettings({
  enabled,
  text,
  link,
}: {
  enabled: boolean;
  text: string;
  link: string;
}) {
  const [on, setOn] = useState(enabled);
  const [message, setMessage] = useState(text);
  const [href, setHref] = useState(link);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updateAnnouncementBanner, null);
  useActionToast(state);

  useResetOnChange([enabled, text, link], () => {
    setOn(enabled);
    setMessage(text);
    setHref(link);
  });

  const dirty = on !== enabled || message !== text || href !== link;

  return (
    <SettingsSection
      description="A coloured bar across the very top of every page, above the menu — for news like a changed meeting point or a special walk. Visitors can close it for a day; changing the wording shows it to them again straight away."
      title="Announcement bar"
    >
      {/* Submitted by hand rather than <form action>: React resets a form
          after an action runs, and the switch follows that reset back to
          its first-loaded value — so a just-saved "on" showed as off until
          the page was refreshed. */}
      <form
        className="flex w-full flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(() => action(formData));
        }}
      >
        <div className="flex items-center gap-3">
          <Switch checked={on} id="announcement-enabled" name="announcementEnabled" onCheckedChange={setOn} />
          <Label htmlFor="announcement-enabled">Show the announcement</Label>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="announcement-text">Announcement</Label>
          <Input
            id="announcement-text"
            maxLength={160}
            name="announcementText"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Sunday's walk now meets at Burrs Country Park"
            value={message}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="announcement-link">Link (optional)</Label>
          <Input
            id="announcement-link"
            name="announcementLink"
            onChange={(event) => setHref(event.target.value)}
            placeholder="/walks"
            value={href}
          />
          <FieldHint>Where tapping the bar goes: a page here like /walks, or a full https:// link.</FieldHint>
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <div className="flex flex-wrap gap-2">
          <Submit disabled={!dirty} pending={pending} />
          {dirty ? (
            <Button
              onClick={() => {
                setOn(enabled);
                setMessage(text);
                setHref(link);
              }}
              type="button"
              variant="outline"
            >
              Discard
            </Button>
          ) : null}
        </div>
      </form>
    </SettingsSection>
  );
}
