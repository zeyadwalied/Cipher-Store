import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon.png",
      },
    ]
  },
};

export default nextConfig;
