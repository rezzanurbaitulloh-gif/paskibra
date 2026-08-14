import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default withPWA(nextConfig);