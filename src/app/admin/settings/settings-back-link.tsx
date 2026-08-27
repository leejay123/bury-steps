"use client";

import Link from "next/link";
import { unlockIdleDocument } from "@/components/overlay-root";

export function SettingsBackLink() {
  return (
    <Link
      className="text-sm text-muted-foreground hover:text-foreground"
      href="/admin/settings"
      onClick={() => {
        unlockIdleDocument();
      }}
      onPointerDown={() => {
        unlockIdleDocument();
      }}
    >
      ← All settings
    </Link>
  );
}
