import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import path from "path";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
    output: 'standalone',
    turbopack: {},
    experimental: {
        serverActions: {
            bodySizeLimit: '20mb',
            allowedOrigins: ['localhost:3000', '192.168.1.7:3000', '192.168.0.*', '192.168.1.*'],
        },
    },
};

export default withPWA(nextConfig);
