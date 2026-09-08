import { EmailLayout, EmailParagraphs, EmailText, type EmailBrand } from "../shared";

export type ContactMessageReceivedEmailProps = EmailBrand & {
  message: string;
  bodyParagraphs: string[];
};

/** Auto-reply to whoever submitted the public contact form. No preferences
 * link — they may not even have an account. */
export function ContactMessageReceivedEmail({
  message,
  bodyParagraphs,
  ...brand
}: ContactMessageReceivedEmailProps) {
  return (
    <EmailLayout
      heading="We've got your message"
      previewText={`Thanks for getting in touch with ${brand.siteName}.`}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
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
