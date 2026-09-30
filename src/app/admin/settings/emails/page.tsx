import { requirePermission } from "@/lib/auth";
import { getEmailTemplateOverrides } from "@/server/actions";
import { EMAIL_TEMPLATES, type EmailTemplateMeta } from "@/lib/email/registry";
import { SettingsPage, SettingsSectionGroup } from "../settings-page";
import { EmailTemplateEditor } from "./email-template-editor";
import { EmailSwitches } from "./email-switches";
import { getDisabledEmailKeys } from "@/lib/email/switches";
import { isOwner } from "@/lib/site-owner";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER: EmailTemplateMeta["category"][] = [
  "Member lifecycle",
  "Walks",
  "Notices",
  "Progress",
  "Contact & newsletter",
  "Organiser alerts",
];

export default async function AdminEmailsSettingsPage() {
  const admin = await requirePermission("permEmails");
  const [overrides, disabled, owner] = await Promise.all([
    getEmailTemplateOverrides(),
    getDisabledEmailKeys(),
    isOwner(admin.id),
  ]);
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    templates: EMAIL_TEMPLATES.filter((meta) => meta.category === category),
  }));

  return (
    <SettingsPage
      description="Edit the subject line and intro wording for each email the site sends. The logo, layout, buttons, and any walk/message details stay fixed — only the prose is yours to change."
      title="Emails"
    >
      <section className="flex flex-col gap-3" id="sending">
        <div className="flex flex-col gap-1">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Which emails are sent</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {owner
              ? "Switch any email off to stop it going to anyone. \"Send test to me\" still works for emails that are off."
              : "Only the site owner can switch emails on or off."}
          </p>
        </div>
        <EmailSwitches canEdit={owner} disabled={[...disabled]} groups={groups} />
      </section>
      {groups.map(({ category, templates }) => (
        <SettingsSectionGroup key={category} title={category}>
          {templates.map((meta) => (
            <EmailTemplateEditor
              key={meta.key}
              meta={meta}
              off={disabled.has(meta.key)}
              override={overrides[meta.key]}
            />
          ))}
        </SettingsSectionGroup>
      ))}
    </SettingsPage>
  );
}
