import type { Metadata, Viewport } from "next";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { AFTER_AUTH_PATH, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/urls";
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
    <ClerkProvider
      signInUrl={SIGN_IN_PATH}
      signUpUrl={SIGN_UP_PATH}
      signInFallbackRedirectUrl={AFTER_AUTH_PATH}
      signUpFallbackRedirectUrl={AFTER_AUTH_PATH}
    >
      <html lang="en-GB" suppressHydrationWarning>
        <body className="min-h-dvh bg-background text-foreground antialiased">
          <header className="border-b">
            <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
              <Link href="/" className="text-sm font-semibold tracking-tight">
                Bury Steps
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <SignedIn>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                    Walks
                  </Link>
                  <UserButton />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal" />
                </SignedOut>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
          <Toaster position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}
