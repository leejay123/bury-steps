"use client";

import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

export function JoinGroupButton({ href }: { href: string }) {
  return <LiquidMetalButton label="Join the group" size="sm" onClick={() => window.location.assign(href)} />;
}
