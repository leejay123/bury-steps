"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { unlockIdleDocument } from "@/components/overlay-root";
import { Button } from "@/components/ui/button";

export function SettingsBackLink() {
  return (
    <Button asChild className="w-fit" size="sm" variant="outline">
      <Link
        href="/admin/settings"
        onClick={() => {
          unlockIdleDocument();
        }}
        onPointerDown={() => {
          unlockIdleDocument();
        }}
      >
        <ChevronLeft data-icon="inline-start" />
        All settings
      </Link>
    </Button>
  );
}
