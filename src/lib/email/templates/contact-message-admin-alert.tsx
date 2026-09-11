import {
  EmailButton,
  EmailFact,
  EmailLayout,
  EmailParagraphs,
  EmailText,
  preserveLineBreaks,
  type EmailBrand,
} from "../shared";

export type ContactMessageAdminAlertEmailProps = EmailBrand & {
  name: string;
  email: string;
  phone: string | null;
  message: string;
  bodyParagraphs: string[];
};

/** This is sent to every opted-in organiser at once (one `to:` with every
 * address in it — organisers already know each other, unlike members), so
 * the preferences link goes to the signed-in /email-preferences page rather
 * than a per-recipient token link. */
export function ContactMessageAdminAlertEmail({
  name,
  email,
  phone,
  message,
  bodyParagraphs,
  ...brand
}: ContactMessageAdminAlertEmailProps) {
  return (
    <EmailLayout
      heading="New contact form message"
      preferencesUrl={`${brand.siteUrl}/email-preferences`}
      previewText={`${name} sent a message through the site.`}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
      <EmailFact label="From" value={name} />
      <EmailFact label="Email" value={email} />
      {phone ? <EmailFact label="Phone" value={phone} /> : null}
      <EmailText
        style={{
          margin: "12px 0 0",
          padding: "12px 16px",
          backgroundColor: "#f4f4f4",
          borderRadius: "6px",
          fontSize: "14px",
          lineHeight: "22px",
          whiteSpace: "pre-wrap",
        }}
      >
        {preserveLineBreaks(message)}
      </EmailText>
      <EmailButton href={`${brand.siteUrl}/admin/messages`}>Open in admin</EmailButton>
    </EmailLayout>
  );
}
