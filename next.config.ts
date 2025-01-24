import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_YEAR
    ? `/${process.env.NEXT_PUBLIC_YEAR}`
    : "",
  output: "export",
};

export default nextConfig;
