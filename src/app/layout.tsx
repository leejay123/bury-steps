import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import { AFTER_AUTH_PATH, SIGN_IN_URL, SIGN_UP_URL } from "@/lib/urls";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bury Steps Walking Group",
  description: "Weekly walks around Bury. Sign up, join a walk, clock in.",
};

export const viewport: Viewport = {
  themeColor: "#1f3d2b",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host") ?? "";
  const useVercelAppProxy = host.endsWith(".vercel.app");

  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <ClerkProvider
          {...(useVercelAppProxy ? { proxyUrl: "/__clerk" } : {})}
          appearance={{
            theme: shadcn,
            variables: {
              colorModalBackdrop: "rgba(18, 28, 22, 0.4)",
              colorInput: "var(--background)",
            },
            elements: {
              modalBackdrop: "backdrop-blur-md",
              input: "bg-background outline-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0",
              formFieldInput: "bg-background outline-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0",
            },
          }}
          signInUrl={SIGN_IN_URL}
          signUpUrl={SIGN_UP_URL}
          signInFallbackRedirectUrl={AFTER_AUTH_PATH}
          signUpFallbackRedirectUrl={AFTER_AUTH_PATH}
        >
          <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/70 shadow-[0_8px_24px_-20px_rgba(15,23,15,0.45)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/55">
            <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
              <Link href="/" className="text-sm font-semibold tracking-tight">
                Bury Steps
              </Link>
              <SiteNav />
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
          <SiteFooter />
          <Toaster position="top-center" />
        </ClerkProvider>
      </body>
    </html>
  );
}
