import { PageTop } from "@/components/page-top";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageTop className="space-y-1" eyebrow="Settings" title="Email preferences" />
    </div>
  );
}
