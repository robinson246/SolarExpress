import type { NextConfig } from "next";

const API_BACKEND = process.env.API_BACKEND_URL || 'http://localhost:4000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: `${API_BACKEND}/api/auth/:path*` },
      { source: '/api/users/:path*', destination: `${API_BACKEND}/api/users/:path*` },
      { source: '/api/bookings/:path*', destination: `${API_BACKEND}/api/bookings/:path*` },
      { source: '/api/notifications/:path*', destination: `${API_BACKEND}/api/notifications/:path*` },
    ];
  },
};

export default nextConfig;
