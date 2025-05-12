/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: {
		// Bildgrößen, hier ist es überlegenswert, den größten Wert
		// aus der Standard Konfiguration (3840) zu verkleinern.
		// https://nextjs.org/docs/pages/api-reference/components/image#devicesizes
		deviceSizes: [640, 768, 1080, 1200, 1920, 2048, 2560],
		formats: ['image/avif', 'image/webp'],
		// https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
			},
			// --- ДОДАНО ХОСТ ДЛЯ VERCEL BLOB ---
			{
				protocol: 'https',
				// Замініть це на ваш реальний хостнейм Vercel Blob, якщо він інший
				hostname: '2tiub218nadtutoj.public.blob.vercel-storage.com',
			},
		],
	},
	// https://nextjs.org/docs/app/building-your-application/routing/redirecting#redirects-in-nextconfigjs
	async redirects() {
		return [
			/*    {
        source: '/shop/category',
        destination: '/shop',
        permanent: true,
      }, */
		];
	},
	experimental: {
		serverActions: {
			// Збільшуємо ліміт розміру тіла запиту
			// Наприклад, до 5MB. Vercel Blob на Hobby плані має ліміт близько 4.5MB на один блоб.
			bodySizeLimit: '5mb', // Можна вказати '2mb', '10mb', '50mb' тощо, або в байтах
		},
	},
};

export default nextConfig;
