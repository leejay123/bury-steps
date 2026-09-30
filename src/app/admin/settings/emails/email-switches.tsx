"use client";

import { setEmailEnabled } from "@/server/actions";
import type { EmailTemplateMeta } from "@/lib/email/registry";
import { useOptimisticSettingToggle } from "@/hooks/use-optimistic-setting-toggle";
import { Switch } from "@/components/ui/switch";

/** What switching an email off breaks, where that's more than "people stop getting it". */
const OFF_WARNINGS: Partial<Record<EmailTemplateMeta["key"], string>> = {
  organiserInvite: "Off: invited organisers won't get their invite link.",
  accidentReportAlert: "Off: other organisers won't hear about new accident reports.",
  contactAdminAlert: "Off: you'll only see new messages by checking Messages.",
};

function EmailSwitchRow({ meta, enabled, canEdit }: { meta: EmailTemplateMeta; enabled: boolean; canEdit: boolean }) {
  const { on, toggle } = useOptimisticSettingToggle({
    action: async (prev, formData) => {
      formData.set("key", meta.key);
      return setEmailEnabled(prev, formData);
    },
    enabled,
    formKey: "enabled",
  });
  const id = `email-switch-${meta.key}`;
  const warning = !on ? OFF_WARNINGS[meta.key] : undefined;

  return (
    <li className="flex items-start justify-between gap-6 px-5 py-3.5 md:px-6">
      <div className="flex min-w-0 flex-col gap-0.5">
        <label className="cursor-pointer text-sm font-medium" htmlFor={id}>
          {meta.label}
        </label>
        <p className="text-sm text-muted-foreground" id={`${id}-description`}>
          {warning ?? meta.trigger}
        </p>
      </div>
      <div className="flex h-6 w-9 shrink-0 items-center justify-center">
        <Switch
          aria-describedby={`${id}-description`}
          checked={on}
          disabled={!canEdit}
          id={id}
          onCheckedChange={toggle}
        />
      </div>
    </li>
  );
}

/**
 * One switch per email the site sends, grouped like the wording editors
 * below. Only the owner can flip them; organisers see where they stand.
 */
export function EmailSwitches({
  groups,
  disabled,
  canEdit,
}: {
  groups: { category: string; templates: EmailTemplateMeta[] }[];
  disabled: string[];
  canEdit: boolean;
}) {
  const off = new Set(disabled);
  return (
    <div className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
      {groups.map((group) => (
        <div className="flex flex-col" key={group.category}>
          <p className="px-5 pt-4 pb-1 text-xs font-medium text-muted-foreground md:px-6">{group.category}</p>
          <ul className="flex flex-col">
            {group.templates.map((meta) => (
              <EmailSwitchRow canEdit={canEdit} enabled={!off.has(meta.key)} key={meta.key} meta={meta} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
