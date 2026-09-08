import { EmailButton, EmailFact, EmailLayout, EmailParagraphs, type EmailBrand } from "../shared";

export type WalkAnnouncedEmailProps = EmailBrand & {
  title: string;
  whenText: string;
  durationText: string;
  meetingPoint: string | null;
  what3words: string | null;
  shareUrl: string;
  preferencesUrl: string;
  bodyParagraphs: string[];
};

export function WalkAnnouncedEmail({
  title,
  whenText,
  durationText,
  meetingPoint,
  what3words,
  shareUrl,
  preferencesUrl,
  bodyParagraphs,
  ...brand
}: WalkAnnouncedEmailProps) {
  return (
    <EmailLayout
      heading={`New walk: ${title}`}
      preferencesUrl={preferencesUrl}
      previewText={`${whenText} — ${meetingPoint ?? "meeting point to follow"}.`}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
      <EmailFact label="When" value={`${whenText} · ${durationText}`} />
      {meetingPoint ? <EmailFact label="Meeting point" value={meetingPoint} /> : null}
      {what3words ? <EmailFact label="what3words" value={what3words} /> : null}
      <EmailButton href={shareUrl}>View the walk &amp; clock in</EmailButton>
    </EmailLayout>
  );
}
