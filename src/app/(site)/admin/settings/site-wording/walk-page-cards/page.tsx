import { redirect } from "next/navigation";

export const instant = false;

/** Card text and walk status wording are edited in the walk page designer. */
export default function WalkPageCardsWordingRedirect() {
  redirect("/admin/walks");
}
