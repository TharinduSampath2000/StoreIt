import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cloud.appwrite.io",
      }
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    }
  }
};

export default nextConfig;
