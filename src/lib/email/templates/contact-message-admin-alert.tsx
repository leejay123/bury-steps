import { EmailButton, EmailFact, EmailLayout, EmailText, type EmailBrand } from "../shared";

export type ContactMessageAdminAlertEmailProps = EmailBrand & {
  name: string;
  email: string;
  phone: string | null;
  message: string;
};

/** No preferences link — this goes to organisers about running the site,
 * not a personal notification an organiser would opt out of. */
export function ContactMessageAdminAlertEmail({
  name,
  email,
  phone,
  message,
  ...brand
}: ContactMessageAdminAlertEmailProps) {
  return (
    <EmailLayout heading="New contact form message" previewText={`${name} sent a message through the site.`} {...brand}>
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
        {message}
      </EmailText>
      <EmailButton href={`${brand.siteUrl}/admin/messages`}>Open in admin</EmailButton>
    </EmailLayout>
  );
}
