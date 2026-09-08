import { EmailButton, EmailLayout, EmailParagraphs, EmailText, type EmailBrand } from "../shared";

export type WelcomeEmailProps = EmailBrand & {
  firstName: string | null;
  preferencesUrl: string;
  bodyParagraphs: string[];
};

export function WelcomeEmail({ firstName, preferencesUrl, bodyParagraphs, ...brand }: WelcomeEmailProps) {
  const greeting = firstName ? `Welcome, ${firstName}!` : "Welcome!";
  return (
    <EmailLayout
      heading={greeting}
      preferencesUrl={preferencesUrl}
      previewText={`You're in — here's what to expect from ${brand.siteName}.`}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
      <EmailButton href={brand.siteUrl}>See upcoming walks</EmailButton>
      <EmailText style={{ margin: "16px 0 0", fontSize: "13px", color: "#737373" }}>
        You can turn any of these emails off from your preferences link below.
      </EmailText>
    </EmailLayout>
  );
}
