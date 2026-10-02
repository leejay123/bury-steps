import { redirect } from "next/navigation";
import { accountPortalUrl } from "@/lib/urls";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(accountPortalUrl("sign-up", await searchParams));
}
