/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed deprecated appDir option
  images: {
    domains: ['localhost'],
  },
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
}

module.exports = nextConfig
