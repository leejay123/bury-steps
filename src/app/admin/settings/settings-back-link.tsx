"use client";

import Link from "next/link";
import { unlockIdleDocument } from "@/components/overlay-root";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function SettingsBackLink({ page }: { page: string }) {
  function unlock() {
    unlockIdleDocument();
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              className="rounded-md px-2 py-1 hover:bg-accent hover:text-accent-foreground"
              href="/admin/settings"
              onClick={unlock}
              onPointerDown={unlock}
            >
              Settings
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
