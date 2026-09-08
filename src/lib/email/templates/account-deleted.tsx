import { EmailLayout, EmailParagraphs, type EmailBrand } from "../shared";

export type AccountDeletedEmailProps = EmailBrand & {
  bodyParagraphs: string[];
};

/** No preferences link — there's nothing left to manage once the account is gone. */
export function AccountDeletedEmail({ bodyParagraphs, ...brand }: AccountDeletedEmailProps) {
  return (
    <EmailLayout
      heading="Your account has been removed"
      previewText={`Your ${brand.siteName} account and data have been deleted.`}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
    </EmailLayout>
  );
}
