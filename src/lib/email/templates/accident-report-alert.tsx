import { EmailButton, EmailFact, EmailLayout, EmailParagraphs, type EmailBrand } from "../shared";

export type AccidentReportAlertEmailProps = EmailBrand & {
  whenText: string;
  walkTitle: string | null;
  whoInvolved: string;
  createdByName: string;
  bodyParagraphs: string[];
};

/** Same batched-send, signed-in-page preferences link as the contact-form
 * admin alert — see that template's comment. */
export function AccidentReportAlertEmail({
  whenText,
  walkTitle,
  whoInvolved,
  createdByName,
  bodyParagraphs,
  ...brand
}: AccidentReportAlertEmailProps) {
  return (
    <EmailLayout
      heading="New accident report"
      preferencesUrl={`${brand.siteUrl}/email-preferences`}
      previewText={`${createdByName} logged an accident report.`}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
      <EmailFact label="Logged by" value={createdByName} />
      <EmailFact label="When" value={whenText} />
      {walkTitle ? <EmailFact label="Walk" value={walkTitle} /> : null}
      <EmailFact label="Who was involved" value={whoInvolved} />
      <EmailButton href={`${brand.siteUrl}/admin/reports`}>Open the report</EmailButton>
    </EmailLayout>
  );
}
