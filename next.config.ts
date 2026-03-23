import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export", // Gjør at Next.js bygger ren HTML/CSS/JS (Nødvendig for GitHub Pages)
  basePath: isProd ? "/turklar" : undefined,
  assetPrefix: isProd ? "/turklar/" : undefined,
  images: {
    unoptimized: true, // Nødvendig siden GitHub Pages ikke har en bilde-komprimeringsserver
  },
};

export default nextConfig;
