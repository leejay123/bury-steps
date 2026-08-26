import { requireAdmin } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../settings-page";
import { AppearanceForm } from "./appearance-form";

export const dynamic = "force-dynamic";

export default async function AppearanceSettingsPage() {
  await requireAdmin();
  const { primaryColor } = await getSiteTheme();

  return (
    <SettingsPage
      description="Used for buttons, links, and highlights across the site. Pick a preset or enter your own colour. The rest of the palette follows it."
      title="Site colour"
    >
      <AppearanceForm primaryColor={primaryColor} />
    </SettingsPage>
  );
}
