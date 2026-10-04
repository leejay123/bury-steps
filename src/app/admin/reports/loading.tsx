import { rememberedCount } from "@/lib/remembered-rows";
import { ReportsPageFallback } from "./page";

export default async function Loading() {
  const rows = await rememberedCount("reports");
  return <ReportsPageFallback rows={rows} />;
}
