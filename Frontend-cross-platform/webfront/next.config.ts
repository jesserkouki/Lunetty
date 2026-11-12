import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://backend:3000";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      { source: "/backend/:path*", destination: `${API_URL}/api/v1/:path*` },
    ];
  },
};

export default nextConfig;