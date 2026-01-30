/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Esto silencia el aviso de Turbopack
  experimental: {
    turbo: {}
  },
  // 2. Agregamos ": any" para que TypeScript deje de reclamar
  webpack: (config: any, { isServer }: any) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        'better-sqlite3': false,
      };
    }
    return config;
  },
};

export default nextConfig;