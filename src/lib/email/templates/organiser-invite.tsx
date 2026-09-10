import { EmailButton, EmailLayout, EmailParagraphs, type EmailBrand } from "../shared";

export type OrganiserInviteEmailProps = EmailBrand & {
  acceptUrl: string;
  bodyParagraphs: string[];
};

/** Invite to become an organiser — sent instead of an instant promotion
 * when SiteSetting.organiserInviteRequired is on. No preferences link:
 * this isn't a preference-driven email, and the recipient isn't an
 * organiser yet (or possibly ever, if they decline by ignoring it). */
export function OrganiserInviteEmail({ acceptUrl, bodyParagraphs, ...brand }: OrganiserInviteEmailProps) {
  return (
    <EmailLayout
      heading="You've been invited to become an organiser"
      previewText={`You've been invited to become an organiser of ${brand.siteName}.`}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
      <EmailButton href={acceptUrl}>Accept and become an organiser</EmailButton>
    </EmailLayout>
  );
}
