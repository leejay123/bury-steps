"use client";

import { useActionState, useState } from "react";
import { Send } from "lucide-react";
import { sendNewsletterCampaign, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { DrawerFormFooter } from "@/components/drawer-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { SettingsSection } from "../settings-page";

export function SendNewsletterForm({ recipientCount }: { recipientCount: number }) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    sendNewsletterCampaign,
    null,
  );
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  useActionToast(state, () => {
    setOpen(false);
    setSubject("");
    setBody("");
  });

  return (
    <SettingsSection
      description="Sends one email, right now, to everyone currently opted into the newsletter — both footer signups and members. There's no draft or schedule; double-check the wording before sending."
      title="Send a newsletter"
    >
      <Drawer
        closeDisabled={isPending}
        onOpenChange={preventDismissWhilePending(isPending, setOpen)}
        open={open}
        variant="form"
      >
        <DrawerTrigger asChild>
          <Button disabled={recipientCount === 0} type="button">
            <Send data-icon="inline-start" />
            Send a newsletter
          </Button>
        </DrawerTrigger>
        <DrawerContent className="min-h-0">
          <form action={action} className="flex min-h-0 flex-1 flex-col">
            <DrawerHeader className="shrink-0">
              <DrawerTitle>Send a newsletter</DrawerTitle>
              <DrawerDescription>
                Sends straight away to {recipientCount} subscriber{recipientCount === 1 ? "" : "s"},
                and can&apos;t be undone.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain px-4 pb-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="newsletter-subject" required>
                  Subject
                </Label>
                <Input
                  id="newsletter-subject"
                  maxLength={200}
                  name="subject"
                  onChange={(event) => setSubject(event.target.value)}
                  required
                  value={subject}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="newsletter-body" required>
                  Message
                </Label>
                <Textarea
                  className="min-h-40"
                  id="newsletter-body"
                  name="body"
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Leave a blank line between paragraphs."
                  required
                  rows={8}
                  value={body}
                />
              </div>
              <FormError message={state && !state.ok ? state.error : null} />
            </div>
            <DrawerFormFooter label={`Send to ${recipientCount}`} pendingLabel="Sending…" />
          </form>
        </DrawerContent>
      </Drawer>
    </SettingsSection>
  );
}
