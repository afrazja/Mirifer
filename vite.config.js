import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			srcDir: './src',
			mode: 'production',
			strategies: 'generateSW',
			registerType: 'autoUpdate',
			manifest: false,
			// Skipping a big lazy chunk (below) is intended: warn, don't fail the build.
			showMaximumFileSizeToCacheInBytesWarning: true, // We already have a static manifest at static/site.webmanifest
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json,mp3}'],
				// Nothing above 400 KB is precached for every learner. Today that leaves out only the
				// on-device pronunciation engine (Module lab, ~540 KB), which loads when it's used.
				maximumFileSizeToCacheInBytes: 400 * 1024
			}
		})
	]
});
