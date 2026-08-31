import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your walks",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
