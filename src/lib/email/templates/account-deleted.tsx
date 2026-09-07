import { EmailLayout, EmailText, type EmailBrand } from "../shared";

export type AccountDeletedEmailProps = EmailBrand & {
  firstName: string | null;
};

/** No preferences link — there's nothing left to manage once the account is gone. */
export function AccountDeletedEmail({ firstName, ...brand }: AccountDeletedEmailProps) {
  return (
    <EmailLayout
      heading="Your account has been removed"
      previewText={`Your ${brand.siteName} account and data have been deleted.`}
      {...brand}
    >
      <EmailText>
        {firstName ? `Hi ${firstName},` : "Hi,"} this confirms your {brand.siteName} account —
        along with your walk and clock-in history — has been permanently deleted.
      </EmailText>
      <EmailText style={{ margin: 0 }}>
        If you didn&apos;t ask for this, or you&apos;d like to walk with us again, get in touch
        with an organiser and they can help.
      </EmailText>
    </EmailLayout>
  );
}
