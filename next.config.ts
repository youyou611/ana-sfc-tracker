import type { NextConfig } from "next";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Shared map source lives at the project root and must be included in deploy tracing.
  outputFileTracingRoot: resolve(appDir, ".."),
};

export default nextConfig;
