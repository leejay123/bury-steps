"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/form-error";
import {
  resetEmailTemplate,
  sendTestEmailTemplate,
  updateEmailTemplate,
  type ActionResult,
} from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import type { EmailTemplateMeta } from "@/lib/email/registry";
import { MAX_EMAIL_TEMPLATE_BODY, MAX_EMAIL_TEMPLATE_SUBJECT } from "@/lib/email/template-limits";
import { SettingsSection } from "../settings-page";

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} size="sm" type="submit">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

function ResetButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} size="sm" type="submit" variant="outline">
      {pending ? "Resetting…" : "Reset to default"}
    </Button>
  );
}

function SendTestButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} size="sm" type="submit" variant="outline">
      {pending ? "Sending…" : "Send test to me"}
    </Button>
  );
}

export function EmailTemplateEditor({
  meta,
  override,
}: {
  meta: EmailTemplateMeta;
  override: { subject: string | null; body: string | null };
}) {
  const savedSubject = override.subject ?? meta.defaultSubject;
  const savedBody = override.body ?? meta.defaultBody;
  const isCustomized = override.subject !== null || override.body !== null;

  const [subject, setSubject] = useState(savedSubject);
  const [body, setBody] = useState(savedBody);
  useResetOnChange([savedSubject, savedBody], () => {
    setSubject(savedSubject);
    setBody(savedBody);
  });

  const [saveState, saveAction] = useActionState<ActionResult | null, FormData>(updateEmailTemplate, null);
  useActionToast(saveState);
  const [resetState, resetAction] = useActionState<ActionResult | null, FormData>(resetEmailTemplate, null);
  useActionToast(resetState);
  const [testState, testAction] = useActionState<ActionResult | null, FormData>(sendTestEmailTemplate, null);
  useActionToast(testState);

  const dirty = subject !== savedSubject || body !== savedBody;

  return (
    <SettingsSection description={meta.trigger} title={meta.label}>
      <form action={saveAction} className="flex flex-col gap-3">
        <input name="key" type="hidden" value={meta.key} />
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${meta.key}-subject`}>Subject</Label>
          <Input
            id={`${meta.key}-subject`}
            maxLength={MAX_EMAIL_TEMPLATE_SUBJECT}
            name="subject"
            onChange={(event) => setSubject(event.target.value)}
            value={subject}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${meta.key}-body`}>Body</Label>
          <Textarea
            id={`${meta.key}-body`}
            maxLength={MAX_EMAIL_TEMPLATE_BODY}
            name="body"
            onChange={(event) => setBody(event.target.value)}
            placeholder="Leave blank for no intro text"
            rows={4}
            value={body}
          />
          <p className="text-xs text-muted-foreground">
            Separate paragraphs with a blank line. Placeholders:{" "}
            {meta.placeholders.map((placeholder, index) => (
              <span key={placeholder.token}>
                {index > 0 ? ", " : ""}
                <code className="rounded bg-muted px-1 py-0.5">{`{${placeholder.token}}`}</code>
              </span>
            ))}
            .
          </p>
        </div>
        <FormError message={saveState && !saveState.ok ? saveState.error : null} />
        <div className="flex flex-wrap gap-2">
          <SaveButton disabled={!dirty} />
          {dirty ? (
            <Button
              onClick={() => {
                setSubject(savedSubject);
                setBody(savedBody);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              Discard
            </Button>
          ) : null}
        </div>
      </form>
      <form action={testAction} className="flex flex-col gap-2 border-t pt-3">
        <input name="key" type="hidden" value={meta.key} />
        <FormError message={testState && !testState.ok ? testState.error : null} />
        <div className="flex items-center gap-2">
          <SendTestButton disabled={dirty} />
          <span className="text-xs text-muted-foreground">
            {dirty ? "Save your changes first to test them." : "Sends a live preview to your own email."}
          </span>
        </div>
      </form>
      {isCustomized ? (
        <form action={resetAction} className="border-t pt-3">
          <input name="key" type="hidden" value={meta.key} />
          <FormError message={resetState && !resetState.ok ? resetState.error : null} />
          <ResetButton />
        </form>
      ) : null}
    </SettingsSection>
  );
}
