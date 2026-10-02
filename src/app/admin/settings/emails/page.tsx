import { requirePermission } from "@/lib/auth";
import { getEmailTemplateOverrides } from "@/server/actions";
import { EMAIL_TEMPLATES, type EmailTemplateMeta } from "@/lib/email/registry";
import { SettingsPage } from "../settings-page";
import { EmailList } from "./email-list";
import { getDisabledEmailKeys } from "@/lib/email/switches";
import { isOwner } from "@/lib/site-owner";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


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
      description="Every email the site sends. Tap one to edit its subject line and intro wording (the logo, layout, buttons and walk or message details stay fixed) or send yourself a test."
      title="Emails"
    >
      <section className="flex flex-col gap-3" id="sending">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {owner
            ? "The switch beside each email turns it on or off for everyone. \"Send test to me\" still works for emails that are off."
            : "Only the site owner can switch emails on or off."}
        </p>
        <EmailList canSwitch={owner} disabled={[...disabled]} groups={groups} overrides={overrides} />
      </section>
    </SettingsPage>
  );
}
