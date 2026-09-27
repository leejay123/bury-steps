import type { ReactNode } from "react";

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="list-decimal pl-5 text-muted-foreground">{children}</ol>;
}

export function GuideBody({ children }: { children: ReactNode }) {
  return (
    <div className="typeset typeset-docs">
      {children}
    </div>
  );
}
