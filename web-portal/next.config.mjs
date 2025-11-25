/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all for demo purposes, refine for production
      },
    ],
  },
};

export default nextConfig;


