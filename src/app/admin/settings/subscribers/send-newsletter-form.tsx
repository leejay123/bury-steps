"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { sendNewsletterCampaign, type ActionResult } from "@/server/actions";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SettingsSection } from "../settings-page";

function SendButton({ recipientCount }: { recipientCount: number }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Sending…" : `Send to ${recipientCount}`}
    </Button>
  );
}

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
      <AlertDialog closeDisabled={isPending} onOpenChange={preventDismissWhilePending(isPending, setOpen)} open={open}>
        <AlertDialogTrigger asChild>
          <Button disabled={recipientCount === 0} type="button">
            <Send data-icon="inline-start" />
            Send a newsletter
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent closeDisabled={isPending}>
          <form action={action} className="flex flex-col gap-4" id="send-newsletter-form">
            <AlertDialogHeader>
              <AlertDialogTitle>Send a newsletter</AlertDialogTitle>
              <AlertDialogDescription>
                Goes out immediately to {recipientCount} subscriber{recipientCount === 1 ? "" : "s"}{" "}
                through Resend. This cannot be recalled once sent.
              </AlertDialogDescription>
            </AlertDialogHeader>
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
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending} type="button">
                Cancel
              </AlertDialogCancel>
              <SendButton recipientCount={recipientCount} />
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  );
}
