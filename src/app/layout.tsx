import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import { AFTER_AUTH_PATH, SIGN_IN_URL, SIGN_UP_URL } from "@/lib/urls";
import { getSiteTheme } from "@/lib/site-theme";
import { SiteMobileNav, SiteNav, SiteNavFallback } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { FullWidthDivider } from "@/components/full-width-divider";
import { MotionPage } from "@/components/motion";
import { BackToTop } from "@/components/back-to-top";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bury Steps Walking Group",
  description: "Weekly walks around Bury. Sign up, join a walk, clock in.",
};

export const preferredRegion = ["lhr1"];

export async function generateViewport(): Promise<Viewport> {
  const { primaryColor } = await getSiteTheme();
  return {
    themeColor: primaryColor,
    width: "device-width",
    initialScale: 1,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const useVercelAppProxy = process.env.VERCEL_ENV === "preview";
  const theme = await getSiteTheme();

  return (
    <html lang="en-GB" style={theme.style} suppressHydrationWarning>
      <body className="min-h-dvh overflow-x-hidden bg-background text-foreground antialiased">
        <ClerkProvider
          {...(useVercelAppProxy ? { proxyUrl: "/__clerk" } : {})}
          appearance={{
            theme: shadcn,
            variables: {
              colorPrimary: theme.primaryColor,
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
          <div className="mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col border-x">
            <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/55">
              <div className="relative">
                <div className="flex h-14 items-center justify-between gap-3 px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-6">
                  <Link href="/" className="flex h-8 min-w-0 items-center justify-self-start">
                    <SiteLogo />
                  </Link>
                  <Suspense fallback={<SiteNavFallback />}>
                    <SiteNav />
                  </Suspense>
                </div>
                <Suspense fallback={null}>
                  <SiteMobileNav />
                </Suspense>
                <FullWidthDivider position="bottom" />
              </div>
            </header>
            <main className="flex-1 px-4 py-8 md:px-8">
              <MotionPage>{children}</MotionPage>
            </main>
            <SiteFooter />
          </div>
          <Toaster position="top-center" />
          <BackToTop />
        </ClerkProvider>
      </body>
    </html>
  );
}
