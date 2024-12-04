/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'mineskin.eu',
                port: '',
                pathname: '/helm/**',
            },
            {
                protocol: 'https',
                hostname: 'crafatar.com',
                port: '',
                pathname: '/avatars/**',
            }
        ],
    },
};

export default nextConfig;
