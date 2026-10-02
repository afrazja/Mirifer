import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		// An open tab checks for a new release every minute (`updated` in the
		// root layout), so nobody keeps looking at an old design.
		version: { pollInterval: 60_000 },
		alias: {
			$components: 'src/lib/components',
			$services: 'src/lib/services',
			$stores: 'src/lib/stores',
			$data: 'src/lib/data',
			$utils: 'src/lib/utils'
		}
	}
};

export default config;
