"use client";

import { MetalFx } from "metal-fx";
import { Button } from "@/components/ui/button";

export function JoinGroupButton({ href }: { href: string }) {
  return (
    <MetalFx preset="silver" strength={0.9} style={{ background: "#000" }} theme="dark">
      <Button asChild className="bg-black text-white hover:bg-black" size="sm">
        <a href={href}>Join the group</a>
      </Button>
    </MetalFx>
  );
}
