import Link from "next/link";

export function SettingsBackLink() {
  return (
    <Link href="/admin/settings" className="text-sm text-muted-foreground hover:text-foreground">
      ← All settings
    </Link>
  );
}
