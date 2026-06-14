/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

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
