import { RevealSuspense } from "@/components/reveal-suspense";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { getEmailTemplateOverrides } from "@/server/actions";
import { EMAIL_TEMPLATES, type EmailTemplateMeta } from "@/lib/email/registry";
import { SettingsPage } from "../settings-page";
import { SettingsMask } from "../settings-mask";
import { PlaceholderPreview } from "@/components/placeholder-preview";

import { EmailList } from "./email-list";
import { getDisabledEmailKeys } from "@/lib/email/switches";
import { isOwner } from "@/lib/site-owner";



const CATEGORY_ORDER: EmailTemplateMeta["category"][] = [
  "Member lifecycle",
  "Walks",
  "Notices",
  "Progress",
  "Contact & newsletter",
  "Organiser alerts",
];

/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function AdminEmailsSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="Every email the site sends. Tap one to edit its subject line and intro wording (the logo, layout, buttons and walk or message details stay fixed) or send yourself a test."
      title="Emails"
    >
      <RevealSuspense fallback={<SettingsFallback />}>
        <PlaceholderPreview fallback={<SettingsFallback />}>
          <AdminEmailsSettingsPageContent />
        </PlaceholderPreview>
      </RevealSuspense>
    </SettingsPage>
  );
}

/** Emails grouped under their headings — fixed, so the placeholder has them too. */
const EMAIL_GROUPS = CATEGORY_ORDER.map((category) => ({
  category,
  templates: EMAIL_TEMPLATES.filter((meta) => meta.category === category),
}));

async function AdminEmailsSettingsPageContent() {
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  const admin = await requirePermission("permEmails");
  const [overrides, disabled, owner] = await Promise.all([
    getEmailTemplateOverrides(),
    getDisabledEmailKeys(),
    isOwner(admin.id),
  ]);
  const groups = EMAIL_GROUPS;

  return <SettingsView disabled={disabled} groups={groups} overrides={overrides} owner={owner} />;
}

/** The page drawn from its saved values (also its placeholder, with stand-ins). */
function SettingsView({
  disabled,
  groups,
  overrides,
  owner,
}: {
  disabled: Set<string> | string[];
  groups: { category: (typeof CATEGORY_ORDER)[number]; templates: typeof EMAIL_TEMPLATES }[];
  overrides: Awaited<ReturnType<typeof getEmailTemplateOverrides>>;
  owner: boolean;
}) {
  return (
    <>
      <section className="flex flex-col gap-3" id="sending">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {owner
            ? "The switch beside each email turns it on or off for everyone. \"Send test to me\" still works for emails that are off."
            : "Only the site owner can switch emails on or off."}
        </p>
        <EmailList canSwitch={owner} disabled={[...disabled]} groups={groups} overrides={overrides} />
      </section>
    </>
  );
}

/** Every email's own wording left as it ships — the placeholder's stand-in. */
const NO_OVERRIDES = Object.fromEntries(
  EMAIL_TEMPLATES.map((meta) => [meta.key, { subject: null, body: null }]),
) as Awaited<ReturnType<typeof getEmailTemplateOverrides>>;

/** While it loads: the page drawn with the site's default values, greyed (SettingsMask). */
function SettingsFallback() {
  return (
    <SettingsMask>
      <SettingsView disabled={[]} groups={EMAIL_GROUPS} overrides={NO_OVERRIDES} owner />
    </SettingsMask>
  );
}
