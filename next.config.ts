import type { NextConfig } from "next";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const nextConfig: NextConfig = {
  // Keep files imported from the repository-level shared/ directory inside
  // Next.js's output tracing context when this app is built from the repo root.
  outputFileTracingRoot: path.resolve(process.cwd()),
  // MapLibre GL JS v6's worker and shared module must be emitted as same-origin
  // public assets for Next.js Turbopack and Webpack builds.
  webpack(config) {
    return config;
  },
};

function copyMapLibreWorkerAssets() {
  const packageDist = path.join(process.cwd(), "node_modules", "maplibre-gl", "dist");
  const publicDir = path.join(process.cwd(), "public", "maplibre");
  const workerFiles = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

  if (!existsSync(packageDist) || !existsSync(publicDir)) return;
  mkdirSync(publicDir, { recursive: true });
  for (const file of workerFiles) {
    const source = path.join(packageDist, file);
    const destination = path.join(publicDir, file);
    if (existsSync(source)) cpSync(source, destination);
  }
}

copyMapLibreWorkerAssets();

export default nextConfig;
