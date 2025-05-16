import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import frappeui from 'frappe-ui/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const isMobile = mode === 'android';
	return {
	plugins: [
		frappeui({
			frappeProxy: !isMobile,
			lucideIcons: true,
			jinjaBootData: !isMobile,
			frappeTypes: {
				input: {},
			},
			buildConfig: {
				indexHtmlPath: isMobile ? null : '../lms/www/lms.html',
			},
		}),
		vue({
			script: {
				defineModel: true,
				propsDestructure: true,
			},
		}),
		VitePWA({
			registerType: 'autoUpdate',
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,json}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/.*\/api\/.*$/,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'api-cache',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
							},
						},
					},
				],
			},
			manifest: {
				name: 'Frappe Learning',
				short_name: 'Learning',
				description: 'Easy to use, open source, Learning Management System',
				theme_color: '#ffffff',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait',
				icons: [
					{
						src: './public/mobile-assets/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: './public/mobile-assets/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: './public/mobile-assets/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			}
		}),
	],
	server: {
		allowedHosts: ['fs', 'persona'],
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
			'tailwind.config.js': path.resolve(__dirname, 'tailwind.config.js'),
		},
	},
	optimizeDeps: {
		include: [
			'feather-icons',
			'showdown',
			'engine.io-client',
			'tailwind.config.js',
			'highlight.js',
			'plyr',
		],
	},
};
})
