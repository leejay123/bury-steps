import { requirePermission } from "@/lib/auth";
import { getEmailTemplateOverrides } from "@/server/actions";
import { EMAIL_TEMPLATES, type EmailTemplateMeta } from "@/lib/email/registry";
import { SettingsPage, SettingsSectionGroup } from "../settings-page";
import { EmailTemplateEditor } from "./email-template-editor";

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
  await requirePermission("permEmails");
  const overrides = await getEmailTemplateOverrides();

  return (
    <SettingsPage
      description="Edit the subject line and intro wording for each email the site sends. The logo, layout, buttons, and any walk/message details stay fixed — only the prose is yours to change."
      title="Emails"
    >
      {CATEGORY_ORDER.map((category) => {
        const templates = EMAIL_TEMPLATES.filter((meta) => meta.category === category);
        return (
          <SettingsSectionGroup key={category} title={category}>
            {templates.map((meta) => (
              <EmailTemplateEditor key={meta.key} meta={meta} override={overrides[meta.key]} />
            ))}
          </SettingsSectionGroup>
        );
      })}
    </SettingsPage>
  );
}
