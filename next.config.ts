import type { NextConfig } from "next";

/**
 * Two build shapes:
 *
 * - default: a normal Next server build, with the Commands route handler doing
 *   the model calls so API keys stay off the client.
 * - STATIC_EXPORT=1: flat files for GitHub Pages. Every page is client-side,
 *   so this works — Commands just runs its offline analysis in the browser.
 *   BASE_PATH sets the repo subpath Pages serves from.
 */
const isExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(isExport
    ? {
        output: "export" as const,
        basePath,
        assetPrefix: basePath || undefined,
        images: { unoptimized: true },
        // Pages serves /foo/ as /foo/index.html
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
