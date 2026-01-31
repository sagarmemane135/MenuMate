const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@menumate/app", "@menumate/db"],
  // Allow ngrok (and similar tunnels) in dev so app works when accessed via tunnel URL
  allowedDevOrigins: [
    "kyle-forgivable-phoenix.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok.io",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
    };
    return config;
  },
};

module.exports = nextConfig;

