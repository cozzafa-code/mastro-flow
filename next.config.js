/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
module.exports = nextConfig
const { withSentryConfig } = require("@sentry/nextjs");
module.exports = withSentryConfig(module.exports, {
  org: "mastro-0v",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
