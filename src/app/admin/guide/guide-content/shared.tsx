import type { ReactNode } from "react";

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="list-decimal pl-5 text-muted-foreground">{children}</ol>;
}

export function GuideBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:mt-1.5 [&_ol]:flex [&_ol]:flex-col [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:flex [&_ul]:flex-col">
      {children}
    </div>
  );
}
