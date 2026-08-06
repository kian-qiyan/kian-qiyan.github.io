import type { NextConfig } from "next";

const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toISOString();

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BUILD_TIMESTAMP: buildTimestamp,
  },
  images: {
    unoptimized: true,
  },
  /* config options here */
  webpack: (config) => {
    config.module.rules.push({
      test: /\.bib$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
