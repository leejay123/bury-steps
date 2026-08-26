import Link from "next/link";
import { FadeIn } from "@/components/motion";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <FadeIn inView={false}>
    <article className="prose prose-neutral max-w-none space-y-4 text-sm leading-relaxed">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">Last updated: 25 August 2026</p>
      <div className="space-y-4 text-foreground [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted-foreground [&_a]:underline">
        {children}
      </div>
      <p className="pt-4 text-xs text-muted-foreground">
        This page is a practical notice for Bury Steps members. It is not legal advice.{" "}
        <Link href="/privacy-policy">Privacy Policy</Link>
        {" · "}
        <Link href="/terms-of-service">Terms of Service</Link>
      </p>
    </article>
    </FadeIn>
  );
}
