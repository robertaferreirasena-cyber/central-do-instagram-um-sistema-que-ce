import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Não empacotar o Chromium/Playwright no bundle serverless (rodam como deps externas na Vercel)
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core", "playwright"],
};

export default nextConfig;
