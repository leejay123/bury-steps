import { EmailLayout, EmailParagraphs, type EmailBrand } from "../shared";

export type NewsletterCampaignEmailProps = EmailBrand & {
  heading: string;
  bodyParagraphs: string[];
};

/**
 * Rendered once and handed to Resend's Broadcasts API — not sent per
 * recipient like the rest of this app's templates. `preferencesUrl` is a
 * literal Resend merge tag string, not a real URL: Resend substitutes
 * {{{RESEND_UNSUBSCRIBE_URL}}} with each recipient's own one-click
 * unsubscribe link at send time. See sendNewsletterCampaign in
 * src/server/actions/newsletter.ts.
 */
export function NewsletterCampaignEmail({ heading, bodyParagraphs, ...brand }: NewsletterCampaignEmailProps) {
  return (
    <EmailLayout
      heading={heading}
      preferencesUrl="{{{RESEND_UNSUBSCRIBE_URL}}}"
      previewText={bodyParagraphs[0] ?? heading}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
    </EmailLayout>
  );
}
