/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "@libsql/client",
    "libsql",
    "drizzle-orm",
    "bcryptjs",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(
        "@libsql/client",
        "libsql",
        "drizzle-orm",
        "drizzle-orm/libsql",
        "drizzle-orm/libsql/migrator",
        "drizzle-orm/migrator",
        "bcryptjs"
      );
    }
    return config;
  },
};

module.exports = nextConfig;
