import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow outbound fetch to is.gd during SSR/API routes
  experimental: {},
};

export default nextConfig;
