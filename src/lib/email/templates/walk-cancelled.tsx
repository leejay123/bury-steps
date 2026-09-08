import { EmailButton, EmailFact, EmailLayout, EmailParagraphs, type EmailBrand } from "../shared";

export type WalkCancelledEmailProps = EmailBrand & {
  title: string;
  whenText: string;
  reason: string | null;
  shareUrl: string;
  preferencesUrl: string;
  bodyParagraphs: string[];
};

export function WalkCancelledEmail({
  title,
  whenText,
  reason,
  shareUrl,
  preferencesUrl,
  bodyParagraphs,
  ...brand
}: WalkCancelledEmailProps) {
  return (
    <EmailLayout
      heading={`Walk cancelled: ${title}`}
      preferencesUrl={preferencesUrl}
      previewText={`${title} (${whenText}) has been cancelled.`}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
      <EmailFact label="Was" value={whenText} />
      {reason ? <EmailFact label="Reason" value={reason} /> : null}
      <EmailButton href={shareUrl}>View the walk page</EmailButton>
    </EmailLayout>
  );
}
