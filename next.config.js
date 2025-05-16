const nextConfig = {
	reactStrictMode: true,
	images: {
		deviceSizes: [640, 768, 1080, 1200, 1920, 2048, 2560],
		formats: ['image/avif', 'image/webp'],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
			},
			{
				protocol: 'https',
				hostname: '2tiub218nadtutoj.public.blob.vercel-storage.com',
			},
		],
	},
	/**
	 * Definiert serverseitige Weiterleitungen.
	 * Ermöglicht das Umleiten von alten Pfaden auf neue oder das Erstellen von Kurz-URLs.
	 * @returns {Promise<Array<object>>} Ein Array von Weiterleitungsobjekten.
	 */
	async redirects() {
		return [];
	},
	experimental: {
		serverActions: {
			bodySizeLimit: '5mb',
		},
	},
};

// Konfigurationsobjekt für Next.js.
// Enthält Einstellungen für React Strict Mode, Bildoptimierung (Gerätegrößen, Formate, Remote-Muster),
// Weiterleitungen und experimentelle Funktionen wie die Größenbeschränkung für Server-Aktionen.
export default nextConfig;
