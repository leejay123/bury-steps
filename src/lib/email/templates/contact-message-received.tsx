import { EmailLayout, EmailText, type EmailBrand } from "../shared";

export type ContactMessageReceivedEmailProps = EmailBrand & {
  name: string;
  message: string;
};

/** Auto-reply to whoever submitted the public contact form. No preferences
 * link — they may not even have an account. */
export function ContactMessageReceivedEmail({
  name,
  message,
  ...brand
}: ContactMessageReceivedEmailProps) {
  return (
    <EmailLayout
      heading="We've got your message"
      previewText={`Thanks for getting in touch with ${brand.siteName}.`}
      {...brand}
    >
      <EmailText>
        Hi {name}, thanks for getting in touch with {brand.siteName}. An organiser will get back
        to you as soon as they can.
      </EmailText>
      <EmailText
        style={{
          margin: 0,
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
    </EmailLayout>
  );
}
