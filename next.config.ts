import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  serverExternalPackages: ["ioredis", "razorpay", "pino", "pino-pretty"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "pino-pretty": false,
    };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
