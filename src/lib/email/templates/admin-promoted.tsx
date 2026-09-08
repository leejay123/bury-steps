import { EmailButton, EmailLayout, EmailParagraphs, type EmailBrand } from "../shared";

export type AdminPromotedEmailProps = EmailBrand & {
  preferencesUrl: string;
  bodyParagraphs: string[];
};

export function AdminPromotedEmail({ preferencesUrl, bodyParagraphs, ...brand }: AdminPromotedEmailProps) {
  return (
    <EmailLayout
      heading="You're now an organiser"
      preferencesUrl={preferencesUrl}
      previewText={`You've been made an organiser of ${brand.siteName}.`}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
      <EmailButton href={`${brand.siteUrl}/admin`}>Open the admin area</EmailButton>
    </EmailLayout>
  );
}
