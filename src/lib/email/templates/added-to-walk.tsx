import { EmailButton, EmailFact, EmailLayout, EmailParagraphs, type EmailBrand } from "../shared";

export type AddedToWalkEmailProps = EmailBrand & {
  title: string;
  whenText: string;
  meetingPoint: string | null;
  shareUrl: string;
  preferencesUrl: string;
  bodyParagraphs: string[];
};

export function AddedToWalkEmail({
  title,
  whenText,
  meetingPoint,
  shareUrl,
  preferencesUrl,
  bodyParagraphs,
  ...brand
}: AddedToWalkEmailProps) {
  return (
    <EmailLayout
      heading="You've been added to a walk"
      preferencesUrl={preferencesUrl}
      previewText={`An organiser added you to ${title}.`}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
      <EmailFact label="When" value={whenText} />
      {meetingPoint ? <EmailFact label="Meeting point" value={meetingPoint} /> : null}
      <EmailButton href={shareUrl}>View the walk</EmailButton>
    </EmailLayout>
  );
}
