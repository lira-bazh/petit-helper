import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/", destination: "/ru", permanent: true },
      { source: "/flowers", destination: "/ru/flowers", permanent: true },
    ];
  },
};

export default nextConfig;
