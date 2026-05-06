/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["mammoth", "xlsx", "docx"],
  },
};

export default nextConfig;
