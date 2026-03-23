import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Gjør at Next.js bygger ren HTML/CSS/JS (Nødvendig for GitHub Pages)
  images: {
    unoptimized: true, // Nødvendig siden GitHub Pages ikke har en bilde-komprimeringsserver
  },
};

export default nextConfig;
