import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// __dirname no está disponible cuando el config se carga como ESM. Lo derivamos
// de import.meta.url y se lo pasamos a turbopack.root para que Next.js no infiera
// el workspace mirando lockfiles de directorios padres (que apuntan a /Users/sergio).
//
// Cuando trabajamos desde un git worktree (.claude/worktrees/<name>/), node_modules
// vive en el repo principal a 3 niveles arriba. Apuntamos turbopack.root al main
// repo para que Turbopack pueda resolver next/* sin salirse del filesystem root.
// En CI / producción este resuelve al mismo directorio (donde está next.config.ts).
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
