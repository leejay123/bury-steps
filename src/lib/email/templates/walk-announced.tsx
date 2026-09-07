import { EmailButton, EmailFact, EmailLayout, EmailText, type EmailBrand } from "../shared";

export type WalkAnnouncedEmailProps = EmailBrand & {
  firstName: string | null;
  title: string;
  whenText: string;
  durationText: string;
  meetingPoint: string | null;
  what3words: string | null;
  shareUrl: string;
  preferencesUrl: string;
};

export function WalkAnnouncedEmail({
  firstName,
  title,
  whenText,
  durationText,
  meetingPoint,
  what3words,
  shareUrl,
  preferencesUrl,
  ...brand
}: WalkAnnouncedEmailProps) {
  return (
    <EmailLayout
      heading={`New walk: ${title}`}
      preferencesUrl={preferencesUrl}
      previewText={`${whenText} — ${meetingPoint ?? "meeting point to follow"}.`}
      {...brand}
    >
      <EmailText>
        {firstName ? `Hi ${firstName},` : "Hi,"} a new walk has been posted. Clock in from an hour
        before it starts.
      </EmailText>
      <EmailFact label="When" value={`${whenText} · ${durationText}`} />
      {meetingPoint ? <EmailFact label="Meeting point" value={meetingPoint} /> : null}
      {what3words ? <EmailFact label="what3words" value={what3words} /> : null}
      <EmailButton href={shareUrl}>View the walk &amp; clock in</EmailButton>
    </EmailLayout>
  );
}
