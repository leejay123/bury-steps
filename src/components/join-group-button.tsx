"use client";

import { MetalFx } from "metal-fx";
import { Button } from "@/components/ui/button";

export function JoinGroupButton({ href }: { href: string }) {
  return (
    <MetalFx
      // metal-fx hides the button until its first WebGL frame lands; on
      // phones where that never happens the button stayed invisible and
      // untappable. Keep it visible and let only the link take taps. Rounded
      // like the button from the start: metal-fx only sets its corners once
      // it has measured the button, so the black fill showed square corners
      // on page load.
      className="visible! rounded-md opacity-100! [&>:not(a)]:pointer-events-none"
      preset="silver"
      strength={0.9}
      style={{ background: "#000" }}
      theme="dark"
    >
      <Button asChild className="bg-black text-white hover:bg-black" size="sm">
        <a href={href}>Join the group</a>
      </Button>
    </MetalFx>
  );
}
