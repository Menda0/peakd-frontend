import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Large multipart uploads via /api/peakd/* (middleware/proxy buffers the body)
  experimental: {
    proxyClientMaxBodySize: "100mb",
  },
};

export default nextConfig;
