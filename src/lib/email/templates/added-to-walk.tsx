import { EmailButton, EmailFact, EmailLayout, EmailText, type EmailBrand } from "../shared";

export type AddedToWalkEmailProps = EmailBrand & {
  firstName: string | null;
  title: string;
  whenText: string;
  meetingPoint: string | null;
  shareUrl: string;
  preferencesUrl: string;
};

export function AddedToWalkEmail({
  firstName,
  title,
  whenText,
  meetingPoint,
  shareUrl,
  preferencesUrl,
  ...brand
}: AddedToWalkEmailProps) {
  return (
    <EmailLayout
      heading="You've been added to a walk"
      preferencesUrl={preferencesUrl}
      previewText={`An organiser added you to ${title}.`}
      {...brand}
    >
      <EmailText>
        {firstName ? `Hi ${firstName},` : "Hi,"} an organiser has added you as attending {title}.
      </EmailText>
      <EmailFact label="When" value={whenText} />
      {meetingPoint ? <EmailFact label="Meeting point" value={meetingPoint} /> : null}
      <EmailButton href={shareUrl}>View the walk</EmailButton>
    </EmailLayout>
  );
}
