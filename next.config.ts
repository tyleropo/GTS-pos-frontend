import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
     allowedDevOrigins: ["localhost:3000", "192.168.254.114:3000", "0.0.0.0:3000"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
