import { Text } from "@react-email/components";
import { EmailLayout, type EmailBrand } from "../shared";

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
      <Text style={{ margin: "0 0 16px" }}>
        {firstName ? `Hi ${firstName},` : "Hi,"} this confirms your {brand.siteName} account —
        along with your walk and clock-in history — has been permanently deleted.
      </Text>
      <Text style={{ margin: 0 }}>
        If you didn&apos;t ask for this, or you&apos;d like to walk with us again, get in touch
        with an organiser and they can help.
      </Text>
    </EmailLayout>
  );
}
