/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Set to false so TypeScript errors surface during builds instead of being
    // silently ignored. Fix any reported errors before deploying to production.
    ignoreBuildErrors: false,
  },
  images: {
    // Images served from the backend (/uploads/*) are not processed by
    // Next.js image optimization, so we disable it globally for simplicity.
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/agent/login',
        destination: '/login',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
