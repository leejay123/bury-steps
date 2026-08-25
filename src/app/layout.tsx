import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import { AFTER_AUTH_PATH, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/urls";
import { SiteNav } from "@/components/site-nav";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <ClerkProvider
          appearance={{
            theme: shadcn,
            variables: {
              colorModalBackdrop: "rgba(18, 28, 22, 0.4)",
            },
            elements: {
              modalBackdrop: "backdrop-blur-md",
            },
          }}
          signInUrl={SIGN_IN_PATH}
          signUpUrl={SIGN_UP_PATH}
          signInFallbackRedirectUrl={AFTER_AUTH_PATH}
          signUpFallbackRedirectUrl={AFTER_AUTH_PATH}
        >
          <header className="border-b">
            <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
              <Link href="/" className="text-sm font-semibold tracking-tight">
                Bury Steps
              </Link>
              <SiteNav />
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
          <Toaster position="top-center" />
        </ClerkProvider>
      </body>
    </html>
  );
}
