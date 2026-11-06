import { getSiteTheme } from "@/lib/site-theme";
import { ShadcnHomePage } from "@/components/shadcnio/page";

export default async function Home() {
  const theme = await getSiteTheme();
  return <ShadcnHomePage theme={theme} />;
}
