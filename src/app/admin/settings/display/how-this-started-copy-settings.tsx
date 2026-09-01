"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronRight } from "lucide-react";
import { updateHowThisStartedCopy, type ActionResult } from "@/server/actions";
import { useActionToast, useNotifyActionState } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DataList,
  DataListBody,
  DataListItem,
  DataListItemMain,
} from "@/components/data-list";
import {
  MAX_HOW_THIS_STARTED_BODY,
  MAX_HOW_THIS_STARTED_EYEBROW,
  MAX_HOW_THIS_STARTED_TEASER,
  MAX_HOW_THIS_STARTED_TITLE,
} from "@/lib/homepage-copy";
import { SettingsSection } from "../settings-page";

function Submit({ disabled, label = "Save" }: { disabled: boolean; label?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Saving…" : label}
    </Button>
  );
}

function bodyPreview(body: string) {
  const trimmed = body.trim();
  if (!trimmed) return "No story yet";
  const firstLine = trimmed.split("\n").find((line) => line.trim())?.trim() ?? trimmed;
  if (firstLine.length <= 96) return firstLine;
  return `${firstLine.slice(0, 96)}…`;
}

function FullStoryDrawer({
  body,
  eyebrow,
  onBodyChange,
  onClose,
  onSaved,
  open,
  teaser,
  title,
}: {
  body: string;
  eyebrow: string;
  onBodyChange: (value: string) => void;
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
  teaser: string;
  title: string;
}) {
  const [draft, setDraft] = useState(body);
  const [state, action, isPending] = useNotifyActionState(updateHowThisStartedCopy, () => {
    onBodyChange(draft);
    onSaved();
  });

  useEffect(() => {
    if (open) setDraft(body);
  }, [body, open]);

  const dirty = draft !== body;

  return (
    <Drawer
      closeDisabled={isPending}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      open={open}
      variant="form"
    >
      <DrawerContent className="sm:max-w-lg">
        <DrawerHeader>
          <DrawerTitle>Full story</DrawerTitle>
          <DrawerDescription>
            Shown in the Read more drawer on the homepage. Use a blank line between paragraphs.
          </DrawerDescription>
        </DrawerHeader>
        <form action={action} className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-6">
          <input name="howThisStartedTitle" type="hidden" value={title} />
          <input name="howThisStartedEyebrow" type="hidden" value={eyebrow} />
          <input name="howThisStartedTeaser" type="hidden" value={teaser} />
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <Label htmlFor="howThisStartedBodyDrawer">Story</Label>
            <Textarea
              className="min-h-64 flex-1 font-mono text-sm"
              id="howThisStartedBodyDrawer"
              maxLength={MAX_HOW_THIS_STARTED_BODY}
              name="howThisStartedBody"
              onChange={(event) => setDraft(event.target.value)}
              required
              rows={16}
              value={draft}
            />
          </div>
          <FormError message={state && !state.ok ? state.error : null} />
          <div className="flex flex-wrap gap-2">
            <Submit disabled={!dirty} />
            {dirty ? (
              <Button onClick={() => setDraft(body)} type="button" variant="outline">
                Discard
              </Button>
            ) : null}
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

export function HowThisStartedCopySettings({
  howThisStartedBody,
  howThisStartedEyebrow,
  howThisStartedTeaser,
  howThisStartedTitle,
}: {
  howThisStartedBody: string;
  howThisStartedEyebrow: string;
  howThisStartedTeaser: string;
  howThisStartedTitle: string;
}) {
  const [title, setTitle] = useState(howThisStartedTitle);
  const [eyebrow, setEyebrow] = useState(howThisStartedEyebrow);
  const [teaser, setTeaser] = useState(howThisStartedTeaser);
  const [body, setBody] = useState(howThisStartedBody);
  const [bodyDrawerOpen, setBodyDrawerOpen] = useState(false);
  const [state, action] = useActionState<ActionResult | null, FormData>(updateHowThisStartedCopy, null);
  useActionToast(state);

  useEffect(() => {
    setTitle(howThisStartedTitle);
    setEyebrow(howThisStartedEyebrow);
    setTeaser(howThisStartedTeaser);
    setBody(howThisStartedBody);
  }, [howThisStartedTitle, howThisStartedEyebrow, howThisStartedTeaser, howThisStartedBody]);

  const inlineDirty =
    title !== howThisStartedTitle ||
    eyebrow !== howThisStartedEyebrow ||
    teaser !== howThisStartedTeaser;

  return (
    <SettingsSection
      description="Homepage blurb and the full story in the Read more drawer."
      title="How this started"
    >
      <div className="flex w-full flex-col gap-4">
        <form action={action} className="flex w-full flex-col gap-4">
          <input name="howThisStartedBody" type="hidden" value={body} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="howThisStartedTitle">Heading</Label>
            <Input
              id="howThisStartedTitle"
              maxLength={MAX_HOW_THIS_STARTED_TITLE}
              name="howThisStartedTitle"
              onChange={(event) => setTitle(event.target.value)}
              required
              value={title}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="howThisStartedEyebrow">Eyebrow (optional)</Label>
            <Input
              id="howThisStartedEyebrow"
              maxLength={MAX_HOW_THIS_STARTED_EYEBROW}
              name="howThisStartedEyebrow"
              onChange={(event) => setEyebrow(event.target.value)}
              value={eyebrow}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="howThisStartedTeaser">Homepage blurb</Label>
            <Textarea
              id="howThisStartedTeaser"
              maxLength={MAX_HOW_THIS_STARTED_TEASER}
              name="howThisStartedTeaser"
              onChange={(event) => setTeaser(event.target.value)}
              required
              rows={3}
              value={teaser}
            />
          </div>
          <FormError message={state && !state.ok ? state.error : null} />
          <div className="flex flex-wrap gap-2">
            <Submit disabled={!inlineDirty} />
            {inlineDirty ? (
              <Button
                onClick={() => {
                  setTitle(howThisStartedTitle);
                  setEyebrow(howThisStartedEyebrow);
                  setTeaser(howThisStartedTeaser);
                }}
                type="button"
                variant="outline"
              >
                Discard
              </Button>
            ) : null}
          </div>
        </form>

        <DataList>
          <DataListItem onClick={() => setBodyDrawerOpen(true)}>
            <DataListItemMain className="items-center">
              <DataListBody>
                <p className="font-medium">Full story</p>
                <p className="text-sm text-muted-foreground">{bodyPreview(body)}</p>
              </DataListBody>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </DataListItemMain>
          </DataListItem>
        </DataList>
      </div>

      <FullStoryDrawer
        body={body}
        eyebrow={eyebrow}
        onBodyChange={setBody}
        onClose={() => setBodyDrawerOpen(false)}
        onSaved={() => setBodyDrawerOpen(false)}
        open={bodyDrawerOpen}
        teaser={teaser}
        title={title}
      />
    </SettingsSection>
  );
}
