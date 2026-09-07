import { EmailButton, EmailFact, EmailLayout, EmailText, type EmailBrand } from "../shared";

export type WalkCancelledEmailProps = EmailBrand & {
  firstName: string | null;
  title: string;
  whenText: string;
  reason: string | null;
  shareUrl: string;
  preferencesUrl: string;
};

export function WalkCancelledEmail({
  firstName,
  title,
  whenText,
  reason,
  shareUrl,
  preferencesUrl,
  ...brand
}: WalkCancelledEmailProps) {
  return (
    <EmailLayout
      heading={`Walk cancelled: ${title}`}
      preferencesUrl={preferencesUrl}
      previewText={`${title} (${whenText}) has been cancelled.`}
      {...brand}
    >
      <EmailText>
        {firstName ? `Hi ${firstName},` : "Hi,"} this walk has been cancelled — no need to turn up.
      </EmailText>
      <EmailFact label="Was" value={whenText} />
      {reason ? <EmailFact label="Reason" value={reason} /> : null}
      <EmailButton href={shareUrl}>View the walk page</EmailButton>
    </EmailLayout>
  );
}
