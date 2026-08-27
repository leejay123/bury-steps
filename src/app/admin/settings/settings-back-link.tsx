"use client";

import Link from "next/link";
import { restorePagePointerEvents } from "@/components/overlay-root";

export function SettingsBackLink() {
  return (
    <Link
      className="text-sm text-muted-foreground hover:text-foreground"
      href="/admin/settings"
      onClick={() => restorePagePointerEvents()}
    >
      ← All settings
    </Link>
  );
}
