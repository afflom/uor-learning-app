// MDX configuration
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    providerImportSource: "@mdx-js/react",
    // Standard minimal configuration that works reliably
    remarkPlugins: [],
    rehypePlugins: []
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  reactStrictMode: true,
  // Enforce type checking during production builds
  typescript: { ignoreBuildErrors: false },
  // Do not ignore ESLint errors during builds
  eslint: { ignoreDuringBuilds: false },
  
  // Simple configuration for development
  compress: true,  // Enable compression
  
  // Optimize chunk loading with minimal configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Use a simpler chunk strategy that's compatible with proxies
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@next|next|react|react-dom)[\\/]/,
            priority: 40,
            enforce: true,
          },
        },
      };
    }
    return config;
  }
});

module.exports = nextConfig;