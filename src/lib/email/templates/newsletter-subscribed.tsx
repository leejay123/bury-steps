import { EmailLayout, EmailText, type EmailBrand } from "../shared";

export type NewsletterSubscribedEmailProps = EmailBrand & {
  unsubscribeUrl: string;
};

export function NewsletterSubscribedEmail({ unsubscribeUrl, ...brand }: NewsletterSubscribedEmailProps) {
  return (
    <EmailLayout
      heading="You're subscribed"
      preferencesUrl={unsubscribeUrl}
      previewText={`Occasional updates from ${brand.siteName}, straight to your inbox.`}
      {...brand}
    >
      <EmailText style={{ margin: 0 }}>
        Thanks for subscribing to the {brand.siteName} newsletter. Expect occasional updates on
        walks and group news — nothing more often than that.
      </EmailText>
    </EmailLayout>
  );
}
