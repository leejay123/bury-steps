import { redirect } from "next/navigation";
import { accountPortalUrl } from "@/lib/urls";

// Only ever redirects, so there's nothing to show instantly.
export const instant = false;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(accountPortalUrl("sign-in", await searchParams));
}
