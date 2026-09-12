import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained server in .next/standalone for the Docker image.
  output: "standalone",
  // Prisma ships a native query engine; keep it out of the bundler.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
