import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'portal-system-rho.vercel.app', 'torecacamp.com'],
    },
  },
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
