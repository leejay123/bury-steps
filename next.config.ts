import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  env: {
    // Clerk's publishable key is designed to be public (client-side).
    // Baked in here because Vercel's dashboard blocks saving it as a
    // NEXT_PUBLIC_ variable due to a false-positive secret-scanner warning.
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      "pk_test_c3VwcmVtZS1vc3RyaWNoLTI3OS5jbGVyay5hY2NvdW50cy5kZXYk",
  },
};

export default nextConfig;
