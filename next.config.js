/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    output: 'standalone',
    // Disable static page generation
    staticPageGenerationTimeout: 0,
    // Disable static exports
    output: process.env.NEXT_EXPORT ? 'export' : 'standalone',
  }


module.exports = nextConfig