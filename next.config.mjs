/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/discord',
                destination: 'https://discord.gg/rvaHetaFHV',
                permanent: true,
            },
        ];
    },
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
            },
            {
                protocol: 'https',
                hostname: 'i.imgur.com',
                port: '',
                pathname: '/**',
            }
        ],
    },
};

export default nextConfig;
