import process from 'node:process';

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  transpilePackages: ['@vibe-planners/ui'],
};

export default nextConfig;
