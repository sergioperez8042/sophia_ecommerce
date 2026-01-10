import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion']
  },
  // Desactivar prefetch automático para evitar errores de navegación
  trailingSlash: false,
  compress: true,
};

export default nextConfig;
