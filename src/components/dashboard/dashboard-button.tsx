"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enterDashboardView } from "./dashboard-view";

/** The header's Dashboard button (signed in): opens the dashboard view at its Overview. */
export function DashboardButton() {
  return (
    <Button asChild size="sm" variant="outline">
      <Link aria-label="Dashboard" href="/dashboard" onClick={enterDashboardView}>
        <LayoutGrid data-icon="inline-start" />
        {/* Just the icon on phones, where the header is tight. */}
        <span className="max-md:hidden">Dashboard</span>
      </Link>
    </Button>
  );
}
