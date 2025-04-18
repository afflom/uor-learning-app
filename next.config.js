const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    providerImportSource: "@mdx-js/react",
    remarkPlugins: [],
    rehypePlugins: [],
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  reactStrictMode: true,
  // Enforce type checking during production builds
  typescript: { ignoreBuildErrors: false },
  // Do not ignore ESLint errors during builds
  eslint: { ignoreDuringBuilds: false }
});

module.exports = nextConfig;