import { redirect } from "next/navigation";

// Only ever redirects, so there's nothing to show instantly.
export const instant = false;

export default function OnboardingPage() {
  redirect("/walks");
}
