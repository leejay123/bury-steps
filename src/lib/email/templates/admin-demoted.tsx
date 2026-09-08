import { EmailButton, EmailLayout, EmailParagraphs, type EmailBrand } from "../shared";

export type AdminDemotedEmailProps = EmailBrand & {
  preferencesUrl: string;
  bodyParagraphs: string[];
};

export function AdminDemotedEmail({ preferencesUrl, bodyParagraphs, ...brand }: AdminDemotedEmailProps) {
  return (
    <EmailLayout
      heading="You're now a member"
      preferencesUrl={preferencesUrl}
      previewText={`Your organiser access on ${brand.siteName} has been removed.`}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
      <EmailButton href={brand.siteUrl}>Open {brand.siteName}</EmailButton>
    </EmailLayout>
  );
}
