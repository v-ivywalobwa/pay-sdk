/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages from TypeScript source so no pre-build step is needed
  transpilePackages: ['@cashia/pay-sdk', '@cashia/pay-sdk-react'],
}

module.exports = nextConfig
