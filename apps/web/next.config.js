/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
    ],
  },

  // Proxy /api/* → Hono worker when NEXT_PUBLIC_API_URL is not set.
  // In production NEXT_PUBLIC_API_URL points directly to the worker, so
  // the browser calls it without going through this rewrite at all.
  async rewrites() {
    const workerUrl =
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';
    return [
      {
        source: '/api/:path*',
        destination: `${workerUrl}/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
