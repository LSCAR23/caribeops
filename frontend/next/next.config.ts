import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Security upgrade provenance (next upgrade --agent=security).
  experimental: {
    agentUpgrade: "security",
    // Client router cache: revisiting a section within 30s reuses what the
    // browser already has instead of asking the server again. Server-side
    // data caching lives in src/lib/data.ts ("use cache" + cacheLife).
    staleTimes: {
      dynamic: 30,
    },
  },
  // Dev-only: trust the loopback IP as well as localhost, otherwise the
  // dev server answers HMR websocket upgrades with 401 Unauthorized.
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
