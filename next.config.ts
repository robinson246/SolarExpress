import type { NextConfig } from "next";
import { getBackendUrl } from './src/lib/backend-url';

const API_BACKEND = getBackendUrl();

const nextConfig: NextConfig = {
  serverExternalPackages: ['@resvg/resvg-js'],
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
