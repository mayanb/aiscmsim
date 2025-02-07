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
    staticPageGenerationTimeout: 120,
    // Disable static exports
    // output: process.env.NEXT_EXPORT ? 'export' : 'standalone',
    experimental: {
      serverActions: true,
    },
    // Force pages to be dynamic instead of static
    env: {
      NEXT_STATIC_GENERATION: 'false'
    }
  }


module.exports = nextConfig


// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   output: 'standalone',
//   staticPageGenerationTimeout: 120,
//   experimental: {
//     serverActions: true,
//   },
//   // Force pages to be dynamic instead of static
//   env: {
//     NEXT_STATIC_GENERATION: 'false'
//   }
// }

// module.exports = nextConfig