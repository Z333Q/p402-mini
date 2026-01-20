/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable standalone output for edge deployment
  output: 'standalone',

  // Environment variables
  env: {
    NEXT_PUBLIC_BASE_CHAIN_ID: process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '8453',
    NEXT_PUBLIC_P402_API_URL: process.env.NEXT_PUBLIC_P402_API_URL,
  },

  // Image optimization for AI-generated content
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.openai.com',
      },
      {
        protocol: 'https',
        hostname: '**.anthropic.com',
      },
      {
        protocol: 'https',
        hostname: '**.replicate.com',
      },
    ],
  },

  // Headers for CORS, caching, and security
  async headers() {
    return [
      // Well-known endpoints (Base mini app manifest)
      {
        source: '/.well-known/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Content-Type', value: 'application/json' },
        ],
      },
      // API routes
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, x-p402-session' },
        ],
      },
      // Security headers for all routes
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://* blob:; font-src 'self'; connect-src 'self' https://* wss://*;"
          },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ],
      },
    ];
  },

  // Rewrites for cleaner URLs
  async rewrites() {
    return [
      // Allow direct access to manifest
      {
        source: '/manifest.json',
        destination: '/.well-known/farcaster.json',
      },
    ];
  },

  // Optional: Redirects for legacy paths
  async redirects() {
    return [];
  },
};

module.exports = nextConfig;