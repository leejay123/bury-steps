import { rememberedCount } from "@/lib/remembered-rows";
import { MessagesPageFallback } from "./page";

export default async function Loading() {
  const rows = await rememberedCount("messages");
  return <MessagesPageFallback rows={rows} />;
}