import { redirect } from "next/navigation";

/** Walks lives at /admin/walks. Older links to /admin still land there. */
export default function AdminIndexPage() {
  redirect("/admin/walks");
}
