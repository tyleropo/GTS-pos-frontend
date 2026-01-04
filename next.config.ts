import type { NextConfig } from "next";
//disable the lint and type check for development only skipped temporarily for deployment
const nextConfig: NextConfig = {
  eslint: {
    // Skip ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript type checking during builds
    ignoreBuildErrors: true,
  },
  experimental: {
     allowedDevOrigins: ["localhost:3000", "192.168.254.114:3000", "0.0.0.0:3000"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "192.168.254.107",
      },
    ],
  },
  async rewrites() {
    return [
      {
       source: "/api/:path*",
        destination: "http://127.0.0.1:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
