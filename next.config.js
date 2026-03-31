/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cache Components - stable in Next.js 16.1.0
  cacheComponents: true,

  // Allow dev server access from WSL IP address and ngrok
  allowedDevOrigins: ['172.20.45.168', '*.ngrok-free.app', '*.ngrok.io'],

  // Experimental features
  experimental: {
    // Server Actions configuration
    serverActions: {
      bodySizeLimit: '50mb', // Increase limit for audio file uploads
    },
  },

  // Enable file watching for WSL2 (Turbopack configuration)
  turbopack: {
    // Turbopack configuration for WSL2
  },

  // Webpack fallback for file watching (if using --webpack flag)
  webpack: (config, { dev, isServer }) => {
    // Only apply polling in development mode (not production builds)
    if (dev) {
      config.watchOptions = {
        poll: 1000, // Increased from 300ms to reduce false positives
        aggregateTimeout: 500,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**', '**/.playwright-mcp/**', '**/.claude/**'],
      };
    }
    return config;
  },
}

export default nextConfig
