/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

if (isProd && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_BASE_URL is required for production builds. ' +
      'Set it to the Railway API base including /api/v1 ' +
      '(see frontend/.env.production.example).',
  )
}

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
