import { SettingsBackLink } from "./settings-back-link";

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SettingsBackLink />
        <div className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-lg tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
