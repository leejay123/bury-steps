"use client";

import { useEffect } from "react";
import { Toaster as Sonner, toast, type ToasterProps } from "sonner";
import { consumeFlashToast } from "@/lib/flash-toast";

function FlashToastReplay() {
  useEffect(() => {
    const flash = consumeFlashToast();
    if (!flash) return;
    if (flash.type === "success") toast.success(flash.message);
    else toast.error(flash.message);
  }, []);
  return null;
}

function Toaster(props: ToasterProps) {
  return (
    <>
      <FlashToastReplay />
      <Sonner
        className="toaster group"
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
          } as React.CSSProperties
        }
        {...props}
      />
    </>
  );
}

export { Toaster };
