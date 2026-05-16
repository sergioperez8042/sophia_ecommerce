import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Anclar turbopack.root al repo principal cuando corremos desde un git worktree
// (.claude/worktrees/<name>/), donde node_modules vive 3 niveles arriba. En CI
// y producción resuelve al directorio del config (comportamiento por defecto).
const configDir = path.dirname(fileURLToPath(import.meta.url));
const isWorktree = configDir.includes(`${path.sep}.claude${path.sep}worktrees${path.sep}`);
const projectRoot = isWorktree ? path.resolve(configDir, "../../..") : configDir;

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  turbopack: {
    // Anclar la raíz al worktree así Next no la infiere a /Users/sergio cuando
    // detecta varios package-lock.json en directorios superiores.
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
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
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
