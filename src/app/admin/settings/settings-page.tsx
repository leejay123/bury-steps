import { SettingsBackLink } from "./settings-back-link";
import { FullWidthDivider } from "@/components/full-width-divider";

export function SettingsPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="relative flex flex-col gap-3 px-4 py-6 md:px-6">
        <SettingsBackLink />
        <div className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-lg tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <FullWidthDivider position="bottom" />
      </div>
      <div className="px-4 py-6 md:px-6">{children}</div>
    </div>
  );
}
