import { EmailButton, EmailLayout, EmailParagraphs, EmailText, type EmailBrand } from "../shared";

export type NoticePostedEmailProps = EmailBrand & {
  title: string;
  /// The notice's own short text, written by whichever organiser posted it
  /// — distinct from bodyParagraphs below, which is this template's own
  /// admin-editable intro line and never contains the actual notice content.
  noticeBody: string;
  /// Full URL — either /notices/<slug> for a PAGE notice, or plain /notices
  /// for a BELL notice (which has no page of its own).
  noticeUrl: string;
  preferencesUrl: string;
  bodyParagraphs: string[];
};

export function NoticePostedEmail({
  title,
  noticeBody,
  noticeUrl,
  preferencesUrl,
  bodyParagraphs,
  ...brand
}: NoticePostedEmailProps) {
  return (
    <EmailLayout
      heading={`New notice: ${title}`}
      preferencesUrl={preferencesUrl}
      previewText={noticeBody || title}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
      <EmailText>{noticeBody}</EmailText>
      <EmailButton href={noticeUrl}>Read it on the site</EmailButton>
    </EmailLayout>
  );
}
