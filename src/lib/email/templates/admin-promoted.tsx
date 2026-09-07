import { EmailButton, EmailLayout, EmailText, type EmailBrand } from "../shared";

export type AdminPromotedEmailProps = EmailBrand & {
  firstName: string | null;
  preferencesUrl: string;
};

export function AdminPromotedEmail({ firstName, preferencesUrl, ...brand }: AdminPromotedEmailProps) {
  return (
    <EmailLayout
      heading="You're now an organiser"
      preferencesUrl={preferencesUrl}
      previewText={`You've been made an organiser of ${brand.siteName}.`}
      {...brand}
    >
      <EmailText>
        {firstName ? `Hi ${firstName},` : "Hi,"} another organiser has given you organiser
        access on {brand.siteName}. You can now create and edit walks, manage members, and see
        who&apos;s coming on each walk.
      </EmailText>
      <EmailButton href={`${brand.siteUrl}/admin`}>Open the admin area</EmailButton>
      <EmailText style={{ margin: "16px 0 0", fontSize: "13px", color: "#737373" }}>
        Didn&apos;t expect this? Let another organiser know.
      </EmailText>
    </EmailLayout>
  );
}
