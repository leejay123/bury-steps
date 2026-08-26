import { requireAdmin } from "@/lib/auth";
import { AdminPageIntro } from "../admin-page-intro";
import { GUIDE_LAST_UPDATED, OrganiserGuide } from "./guide-content";

export const dynamic = "force-dynamic";

export default async function OrganiserGuidePage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageIntro
        description={`How this website works, and how to run walks, members, and the homepage. Last updated ${GUIDE_LAST_UPDATED}.`}
        title="Guide"
      />
      <OrganiserGuide />
    </div>
  );
}
