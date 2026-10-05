"use client";

import { startTransition, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  resetEmailTemplate,
  sendTestEmailTemplate,
  setEmailEnabled,
  updateEmailTemplate,
} from "@/server/actions";
import type { EmailTemplateMeta, EmailTemplateOverrideValues } from "@/lib/email/registry";
import { MAX_EMAIL_TEMPLATE_BODY, MAX_EMAIL_TEMPLATE_SUBJECT } from "@/lib/email/template-limits";
import { useActionToast, useNotifyActionState } from "@/hooks/use-action-toast";
import { useControlledDrawerDismissGuard } from "@/hooks/use-controlled-drawer";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useSafeActionState } from "@/hooks/use-safe-action-state";
import { DrawerFormFooter, FieldHint } from "@/components/drawer-form";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/** What switching an email off breaks, where that's more than "people stop getting it". */
const OFF_WARNINGS: Partial<Record<EmailTemplateMeta["key"], string>> = {
  organiserInvite: "Off: invited organisers won't get their invite link.",
  accidentReportAlert: "Off: other organisers won't hear about new accident reports.",
  contactAdminAlert: "Off: you'll only see new messages by checking Messages.",
};

/** Subject, wording, a test send and reset — everything for one email, in a drawer. */
function EmailEditDrawer({
  meta,
  onClose,
  onPointerDownOutside,
  open,
  override,
}: {
  meta: EmailTemplateMeta;
  onClose: () => void;
  onPointerDownOutside: (event: Event) => void;
  open: boolean;
  override: EmailTemplateOverrideValues;
}) {
  const savedSubject = override.subject ?? meta.defaultSubject;
  const savedBody = override.body ?? meta.defaultBody;
  const isCustomized = override.subject !== null || override.body !== null;

  const [subject, setSubject] = useState(savedSubject);
  const [body, setBody] = useState(savedBody);
  // Fresh from what's saved each time it opens, and after a reset.
  useResetOnChange([savedSubject, savedBody, open], () => {
    setSubject(savedSubject);
    setBody(savedBody);
  });

  const [saveState, saveAction, saving] = useNotifyActionState(updateEmailTemplate, onClose);
  const [testState, testAction, testing] = useSafeActionState(sendTestEmailTemplate);
  useActionToast(testState);
  const [resetState, resetAction, resetting] = useSafeActionState(resetEmailTemplate);
  useActionToast(resetState);

  const dirty = subject !== savedSubject || body !== savedBody;
  const run = (action: (formData: FormData) => void) => {
    const formData = new FormData();
    formData.set("key", meta.key);
    startTransition(() => action(formData));
  };

  return (
    <Drawer
      closeDisabled={saving}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      open={open}
      variant="form"
    >
      <DrawerContent onPointerDownOutside={onPointerDownOutside}>
        <DrawerHeader>
          <DrawerTitle>{meta.label}</DrawerTitle>
          <DrawerDescription>{meta.trigger}</DrawerDescription>
        </DrawerHeader>
        <form action={saveAction} className="flex min-h-0 flex-1 flex-col">
          <input name="key" type="hidden" value={meta.key} />
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain px-4 pb-4">
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
                aria-describedby={`${meta.key}-body-hint`}
                id={`${meta.key}-body`}
                maxLength={MAX_EMAIL_TEMPLATE_BODY}
                name="body"
                onChange={(event) => setBody(event.target.value)}
                placeholder="Leave blank for no intro text"
                rows={7}
                value={body}
              />
              <FieldHint id={`${meta.key}-body-hint`}>
                Separate paragraphs with a blank line. Placeholders:{" "}
                {meta.placeholders.map((placeholder, index) => (
                  <span key={placeholder.token}>
                    {index > 0 ? ", " : ""}
                    <code className="rounded bg-muted px-1 py-0.5">{`{${placeholder.token}}`}</code>
                  </span>
                ))}
                .
              </FieldHint>
            </div>
            <FormError message={saveState && !saveState.ok ? saveState.error : null} />

            <div className="flex flex-col gap-2 border-t pt-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={dirty || testing}
                  onClick={() => run(testAction)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {testing ? "Sending…" : "Send test to me"}
                </Button>
                {isCustomized ? (
                  <Button
                    disabled={resetting}
                    onClick={() => run(resetAction)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {resetting ? "Resetting…" : "Reset to default"}
                  </Button>
                ) : null}
              </div>
              <FieldHint>
                {dirty ? "Save your changes first to test them." : "Sends a live preview to your own email."}
              </FieldHint>
              <FormError message={testState && !testState.ok ? testState.error : null} />
              <FormError message={resetState && !resetState.ok ? resetState.error : null} />
            </div>
          </div>
          <DrawerFormFooter disabled={!dirty} label="Save" pendingLabel="Saving…" />
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function EmailRow({
  canSwitch,
  enabled,
  meta,
  onOpen,
}: {
  canSwitch: boolean;
  enabled: boolean;
  meta: EmailTemplateMeta;
  onOpen: () => void;
}) {
  const { on, toggle } = useOptimisticSettingToggle({
    action: async (prev, formData) => {
      formData.set("key", meta.key);
      return setEmailEnabled(prev, formData);
    },
    enabled,
    formKey: "enabled",
  });
  const id = `email-switch-${meta.key}`;

  return (
    <li className="flex items-center gap-4 px-5 py-3.5 md:px-6">
      <button
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onOpen}
        type="button"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium">{meta.label}</span>
          <span className="text-sm text-muted-foreground" id={`${id}-description`}>
            {on ? meta.trigger : (OFF_WARNINGS[meta.key] ?? "Off: not being sent to anyone.")}
          </span>
        </span>
        <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <div className="flex h-6 w-9 shrink-0 items-center justify-center">
        <Switch
          aria-describedby={`${id}-description`}
          aria-label={`Send the ${meta.label} email`}
          checked={on}
          disabled={!canSwitch}
          id={id}
          onCheckedChange={toggle}
        />
      </div>
    </li>
  );
}

/**
 * Every email the site sends, grouped. Tap one to edit its wording in a
 * drawer; the switch beside it turns it on or off (owner only).
 */
export function EmailList({
  canSwitch,
  disabled,
  groups,
  overrides,
}: {
  canSwitch: boolean;
  disabled: string[];
  groups: { category: string; templates: EmailTemplateMeta[] }[];
  overrides: Record<string, EmailTemplateOverrideValues>;
}) {
  const off = new Set(disabled);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const { openSoon, onPointerDownOutside } = useControlledDrawerDismissGuard();
  const all = groups.flatMap((group) => group.templates);

  return (
    <>
      <div className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
        {groups.map((group) => (
          <div className="flex flex-col" key={group.category}>
            <p className="px-5 pt-4 pb-1 text-xs font-medium text-muted-foreground md:px-6">{group.category}</p>
            <ul className="flex flex-col">
              {group.templates.map((meta) => (
                <EmailRow
                  canSwitch={canSwitch}
                  enabled={!off.has(meta.key)}
                  key={meta.key}
                  meta={meta}
                  onOpen={() => openSoon(() => setOpenKey(meta.key))}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
      {all.map((meta) => (
        <EmailEditDrawer
          key={meta.key}
          meta={meta}
          onClose={() => setOpenKey(null)}
          onPointerDownOutside={onPointerDownOutside}
          open={openKey === meta.key}
          override={overrides[meta.key]}
        />
      ))}
    </>
  );
}
