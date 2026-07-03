import type { NextConfig } from "next";

// GitHub Pages static export configuration.
// The basePath is auto-detected from the GITHUB_REPOSITORY env var during
// GitHub Actions builds (e.g. "user/repo" -> basePath "/repo").
// For local builds / user pages (user.github.io), set NEXT_PUBLIC_BASE_PATH="".
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (repo ? `/${repo}` : "");

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
