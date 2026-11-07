import {
  AlertTriangle,
  Archive,
  Bell,
  LayoutGrid,
  ListChecks,
  Mail,
  Paintbrush,
  Settings2,
  SlidersHorizontal,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/** Icon per Settings page (see src/lib/settings-pages.ts), for the
 * Settings home's card table. */
export const SETTINGS_PAGE_ICONS: Record<string, LucideIcon> = {
  "/admin/settings/branding": LayoutGrid,
  "/admin/settings/page-designs": Paintbrush,
  "/admin/settings/notices": Bell,
  "/admin/settings/emails": Mail,
  "/admin/settings/progress": TrendingUp,
  "/admin/settings/walk-essentials": ListChecks,
  "/admin/settings/behaviour": Settings2,
  "/admin/settings/retention": Archive,
  "/admin/settings/reset": AlertTriangle,
};

export function SettingsPageIcon({
  href,
  ...props
}: { href: string } & React.ComponentProps<LucideIcon>) {
  const Icon = SETTINGS_PAGE_ICONS[href] ?? SlidersHorizontal;
  return <Icon {...props} />;
}
