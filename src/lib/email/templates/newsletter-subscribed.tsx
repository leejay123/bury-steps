import { EmailLayout, EmailParagraphs, type EmailBrand } from "../shared";

export type NewsletterSubscribedEmailProps = EmailBrand & {
  unsubscribeUrl: string;
  bodyParagraphs: string[];
};

export function NewsletterSubscribedEmail({
  unsubscribeUrl,
  bodyParagraphs,
  ...brand
}: NewsletterSubscribedEmailProps) {
  return (
    <EmailLayout
      heading="You're subscribed"
      preferencesUrl={unsubscribeUrl}
      previewText={`Occasional updates from ${brand.siteName}, straight to your inbox.`}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
    </EmailLayout>
  );
}
