import type { NextConfig } from "next";
import path from "node:path";

const activePagesDirectory = process.env.NEXT_PUBLIC_APP_VARIANT === "student"
  ? "src/products/student/pages"
  : "src/products/active-pages";
const activePageModules = [
  "home-page",
  "test-page",
  "result-page",
  "admin-layout",
  "admin-dashboard-page",
  "admin-questions-page",
  "respect-page",
  "respect-check-page",
  "respect-result-page",
] as const;

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  webpack(config) {
    const productPageAliases: Record<string, string> = {};
    for (const moduleName of activePageModules) {
      const targetPath = path.resolve(
        process.cwd(),
        activePagesDirectory,
        `${moduleName}.tsx`,
      );
      productPageAliases[`@/products/active-pages/${moduleName}$`] = targetPath;
      productPageAliases[`${path.resolve(
        process.cwd(),
        "src/products/active-pages",
        `${moduleName}.tsx`,
      )}$`] = targetPath;
    }
    config.resolve.alias = {
      ...productPageAliases,
      ...config.resolve.alias,
    };
    return config;
  },
};

export default nextConfig;
