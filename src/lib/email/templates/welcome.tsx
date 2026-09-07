import { EmailButton, EmailLayout, EmailText, type EmailBrand } from "../shared";

export type WelcomeEmailProps = EmailBrand & {
  firstName: string | null;
  preferencesUrl: string;
};

export function WelcomeEmail({ firstName, preferencesUrl, ...brand }: WelcomeEmailProps) {
  const greeting = firstName ? `Welcome, ${firstName}!` : "Welcome!";
  return (
    <EmailLayout
      heading={greeting}
      preferencesUrl={preferencesUrl}
      previewText={`You're in — here's what to expect from ${brand.siteName}.`}
      {...brand}
    >
      <EmailText>
        Thanks for joining {brand.siteName}. Upcoming walks show up on your dashboard, and
        you&apos;ll get an email when a new one is posted — location, meeting point, start
        time, and a link to clock in on the day.
      </EmailText>
      <EmailText>Come as you are — no winners, no losers, just people walking together.</EmailText>
      <EmailButton href={brand.siteUrl}>See upcoming walks</EmailButton>
      <EmailText style={{ margin: "16px 0 0", fontSize: "13px", color: "#737373" }}>
        You can turn any of these emails off from your preferences link below.
      </EmailText>
    </EmailLayout>
  );
}
