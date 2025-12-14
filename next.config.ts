import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // output: "export", // <- commente ou supprime cette ligne
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
  // Spécifier explicitement le répertoire racine pour éviter le warning des lockfiles multiples
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
