"use client";

import { useState } from "react";
import { updateAnnouncementCopy } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveBar } from "@/components/save-bar";
import {
  MAX_ANNOUNCEMENT_HREF,
  MAX_ANNOUNCEMENT_LINE,
  MAX_ANNOUNCEMENT_LINK_LABEL,
  MAX_ANNOUNCEMENT_TITLE,
  parseAnnouncementCopy,
} from "@/lib/announcement";
import { SettingsSection } from "../settings-page";

/** The join bar's own words and link. An empty first line keeps the usual join wording. */
export function AnnouncementCopySettings({ text, link }: { text: string; link: string }) {
  const saved = parseAnnouncementCopy(text, link) ?? { title: "", line: "", linkLabel: "", href: "" };
  const [title, setTitle] = useState(saved.title);
  const [line, setLine] = useState(saved.line);
  const [linkLabel, setLinkLabel] = useState(saved.linkLabel);
  const [href, setHref] = useState(saved.href);
  const [state, action, pending, clearError] = useSafeActionState(updateAnnouncementCopy);
  useActionToast(state);

  const reset = () => {
    setTitle(saved.title);
    setLine(saved.line);
    setLinkLabel(saved.linkLabel);
    setHref(saved.href);
  };
  useResetOnChange([text, link], reset);

  const dirty = title !== saved.title || line !== saved.line || linkLabel !== saved.linkLabel || href !== saved.href;
  const form = useSaveBar(dirty, pending, () => {
    reset();
    clearError();
  });

  return (
    <SettingsSection
      description="Your own words and link for the strip, such as a fundraiser or an event. Leave the first line empty to keep “New here? Come for a walk.” and the sign-up link."
      title="Join bar wording"
    >
      <form action={action} className="flex w-full flex-col gap-4" ref={form}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="announcementTitle">First line (in bold)</Label>
          <Input
            id="announcementTitle"
            maxLength={MAX_ANNOUNCEMENT_TITLE}
            name="announcementTitle"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="New here? Come for a walk."
            value={title}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="announcementLine">More words (big screens only)</Label>
          <Input
            id="announcementLine"
            maxLength={MAX_ANNOUNCEMENT_LINE}
            name="announcementLine"
            onChange={(event) => setLine(event.target.value)}
            placeholder="Joining is free, and every walk goes at the pace of the group."
            value={line}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="announcementLinkLabel">Link words</Label>
            <Input
              id="announcementLinkLabel"
              maxLength={MAX_ANNOUNCEMENT_LINK_LABEL}
              name="announcementLinkLabel"
              onChange={(event) => setLinkLabel(event.target.value)}
              placeholder="Join free"
              value={linkLabel}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="announcementHref">Link</Label>
            <Input
              id="announcementHref"
              inputMode="url"
              maxLength={MAX_ANNOUNCEMENT_HREF}
              name="announcementHref"
              onChange={(event) => setHref(event.target.value)}
              placeholder="/charity-of-the-year or https://…"
              value={href}
            />
          </div>
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
      </form>
    </SettingsSection>
  );
}
