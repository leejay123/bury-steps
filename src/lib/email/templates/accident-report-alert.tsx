import { EmailButton, EmailFact, EmailLayout, type EmailBrand } from "../shared";

export type AccidentReportAlertEmailProps = EmailBrand & {
  whenText: string;
  walkTitle: string | null;
  whoInvolved: string;
  createdByName: string;
};

/** No preferences link — organiser-operational, like the contact-form admin alert. */
export function AccidentReportAlertEmail({
  whenText,
  walkTitle,
  whoInvolved,
  createdByName,
  ...brand
}: AccidentReportAlertEmailProps) {
  return (
    <EmailLayout
      heading="New accident report"
      previewText={`${createdByName} logged an accident report.`}
      {...brand}
    >
      <EmailFact label="Logged by" value={createdByName} />
      <EmailFact label="When" value={whenText} />
      {walkTitle ? <EmailFact label="Walk" value={walkTitle} /> : null}
      <EmailFact label="Who was involved" value={whoInvolved} />
      <EmailButton href={`${brand.siteUrl}/admin/reports`}>Open the report</EmailButton>
    </EmailLayout>
  );
}
