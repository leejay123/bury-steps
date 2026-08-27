import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
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
};

export default nextConfig;
