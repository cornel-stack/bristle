import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bristle/ui", "@bristle/db", "@bristle/shared"],
};

export default nextConfig;
