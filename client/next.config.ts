import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// This app lives in `client/` while the repo root also contains a lockfile.
// Pin the build root so Next/Turbopack don't infer the wrong directory.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: { root: projectRoot },
};

export default nextConfig;
