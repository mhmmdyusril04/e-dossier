import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                hostname: '*.convex.cloud',
            },
        ],
    },
};

export default nextConfig;
