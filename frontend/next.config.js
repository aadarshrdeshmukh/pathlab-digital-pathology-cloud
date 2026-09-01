/** @type {import('next').NextConfig} */
const rawApiUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const BACKEND_URL = rawApiUrl.replace(/\/api\/?$/, '');

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Proxy local /api calls to the Express API backend
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      // Proxy local /uploads calls to the Express backend uploads directory
      {
        source: '/uploads/:path*',
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
