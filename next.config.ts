import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // output: "export", // <- commente ou supprime cette ligne
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
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
