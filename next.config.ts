import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The build script runs TypeScript 7 before Next.js. Next still needs the
  // older TypeScript compiler API for configuration and editor tooling.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "pamusha.com",
        pathname: "/wp-content/themes/pamusha/assets/img/**",
      },
      {
        protocol: "https",
        hostname: "batokaafrica.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "africansun.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "cb0528c2.delivery.rocketcdn.me",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "forestcreek.co.zw",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
