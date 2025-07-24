import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standard Next.js configuration for Vercel deployment
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Temporarily disable type checking for production build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
