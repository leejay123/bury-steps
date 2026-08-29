import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Parent lockfiles made Next treat ~ as the app root and bundle the wrong Prisma client.
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "www.burysteps-walkinggroup.co.uk" }],
        destination: "https://burysteps-walkinggroup.co.uk/",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.burysteps-walkinggroup.co.uk" }],
        destination: "https://burysteps-walkinggroup.co.uk/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    // Clerk's hosted UI needs its own frontend API domain (the CNAME set up
    // for the live site, or *.clerk.accounts.dev for local dev/anywhere the
    // Vercel preview proxy at /__clerk isn't in play) plus Cloudflare
    // Turnstile for its bot-protection challenge during sign-up. Walk share
    // pages embed OpenStreetMap for the meeting-point map (no API key).
    // Script and style still allow 'unsafe-inline' — a nonce-based policy
    // needs the whole app on dynamic rendering (see Next.js' and Clerk's own
    // docs on this), which is a bigger, riskier change than this pass is
    // making. Even so, restricting connect/frame/img/script *origins* to a
    // known allowlist still blocks the most common CSP-relevant attacks:
    // loading a remote payload or exfiltrating data to an attacker-controlled
    // host.
    const clerkOrigins = [
      "https://clerk.burysteps-walkinggroup.co.uk",
      "https://*.clerk.accounts.dev",
    ];
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${clerkOrigins.join(" ")} https://challenges.cloudflare.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${clerkOrigins.join(" ")} https://challenges.cloudflare.com https://vitals.vercel-insights.com`,
      `frame-src 'self' ${clerkOrigins.join(" ")} https://challenges.cloudflare.com https://www.openstreetmap.org`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
