"use client";

import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

export function JoinGroupButton({ href }: { href: string }) {
  return <LiquidMetalButton label="Join the group" onClick={() => window.location.assign(href)} />;
}
