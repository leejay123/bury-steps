import { Text } from "@react-email/components";
import { EmailButton, EmailLayout, type EmailBrand } from "../shared";

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
      <Text style={{ margin: "0 0 16px" }}>
        {firstName ? `Hi ${firstName},` : "Hi,"} another organiser has given you organiser
        access on {brand.siteName}. You can now create and edit walks, manage members, and see
        who&apos;s coming on each walk.
      </Text>
      <EmailButton href={`${brand.siteUrl}/admin`}>Open the admin area</EmailButton>
      <Text style={{ margin: "16px 0 0", fontSize: "13px", color: "#737373" }}>
        Didn&apos;t expect this? Let another organiser know.
      </Text>
    </EmailLayout>
  );
}
