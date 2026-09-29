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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { announcementPaths, announcementScope, type AnnouncementScope } from "@/lib/announcement-pages";
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
  pages,
}: {
  enabled: boolean;
  text: string;
  link: string;
  pages: string;
}) {
  const initialScope = announcementScope(pages);
  const initialPaths = announcementPaths(pages).join(", ");
  const [scope, setScope] = useState<AnnouncementScope>(initialScope);
  const [paths, setPaths] = useState(initialPaths);
  const [on, setOn] = useState(enabled);
  const [message, setMessage] = useState(text);
  const [href, setHref] = useState(link);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updateAnnouncementBanner, null);
  useActionToast(state);

  const reset = () => {
    setOn(enabled);
    setMessage(text);
    setHref(link);
    setScope(initialScope);
    setPaths(initialPaths);
  };
  useResetOnChange([enabled, text, link, pages], reset);

  const dirty =
    on !== enabled ||
    message !== text ||
    href !== link ||
    scope !== initialScope ||
    (scope === "pages" && paths !== initialPaths);

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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="announcement-scope">Show it on</Label>
          <input name="announcementScope" type="hidden" value={scope} />
          <Select onValueChange={(value) => setScope(value as AnnouncementScope)} value={scope}>
            <SelectTrigger className="w-full sm:w-[20rem]" id="announcement-scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Every page</SelectItem>
              <SelectItem value="home">Homepage only</SelectItem>
              <SelectItem value="public">Public pages (not the organiser area)</SelectItem>
              <SelectItem value="pages">Chosen pages…</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {scope === "pages" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="announcement-paths">Pages</Label>
            <Input
              id="announcement-paths"
              name="announcementPaths"
              onChange={(event) => setPaths(event.target.value)}
              placeholder="/walks, /notices"
              value={paths}
            />
            <FieldHint>
              The part of the address after the site name, separated by commas. / is the homepage; /walks also
              covers every page under it.
            </FieldHint>
          </div>
        ) : null}
        <FormError message={state && !state.ok ? state.error : null} />
        <div className="flex flex-wrap gap-2">
          <Submit disabled={!dirty} pending={pending} />
          {dirty ? (
            <Button
              onClick={reset}
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
