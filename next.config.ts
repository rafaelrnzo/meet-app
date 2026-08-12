import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.110.60'],
  output: 'standalone',
  reactCompiler: true,
  experimental: {
    optimizePackageImports: [
      '@phosphor-icons/react',
      '@hugeicons/react',
      '@hugeicons/core-free-icons',
    ],
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
}

export default nextConfig
