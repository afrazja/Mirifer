import type { RequestHandler } from './$types';

/**
 * Full reverse proxy for Microsoft Clarity.
 *
 * Clarity's CDN (*.clarity.ms) is DNS-blocked by some ISPs (resolves to 0.0.0.0).
 * This proxy routes ALL Clarity requests through our own domain so Vercel's
 * serverless functions (US data centers) can reach clarity.ms on behalf of clients.
 *
 * URL pattern:  /proxy/clarity/s/{subdomain}/{rest...}
 *   → https://{subdomain}.clarity.ms/{rest...}
 */

// Allowed Clarity subdomains for security
const ALLOWED_SUBDOMAINS = new Set([
	'www', 'scripts', 'report', 'o', 'c', 'e',
	'a', 'b', 'd', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
	'm', 'n', 'p', 'q', 'r', 't', 'u', 'v', 'w', 'x', 'y', 'z'
]);

/**
 * Rewrite ALL *.clarity.ms URLs to route through our proxy.
 */
function rewriteBody(body: string, origin: string): string {
	return body.replace(
		/https:\/\/([\w-]+)\.clarity\.ms\//g,
		`${origin}/proxy/clarity/s/$1/`
	);
}

function buildUpstreamUrl(path: string): string | null {
	const segments = path.split('/');

	// New format: /proxy/clarity/s/{subdomain}/{rest}
	if (segments[0] === 's' && segments.length >= 3) {
		const subdomain = segments[1];
		const rest = segments.slice(2).join('/');
		if (!ALLOWED_SUBDOMAINS.has(subdomain)) return null;
		return `https://${subdomain}.clarity.ms/${rest}`;
	}

	// Legacy format: backward compatibility
	const prefix = segments[0];
	if (prefix === 'tag') return `https://www.clarity.ms/${segments.join('/')}`;
	if (prefix === 'scripts') return `https://scripts.clarity.ms/${segments.slice(1).join('/')}`;
	if (prefix === 'collect') return `https://o.clarity.ms/${segments.join('/')}`;
	if (prefix === 'c') return `https://c.clarity.ms/${segments.slice(1).join('/')}`;

	return null;
}

export const GET: RequestHandler = async ({ params, url, request }) => {
	const path = params.path;
	if (!path) return new Response('Not found', { status: 404 });

	const upstreamUrl = buildUpstreamUrl(path);
	if (!upstreamUrl) return new Response('Not found', { status: 404 });

	const fullUrl = url.search ? `${upstreamUrl}${url.search}` : upstreamUrl;

	try {
		const upstream = await fetch(fullUrl, {
			headers: {
				'User-Agent': request.headers.get('user-agent') || '',
				'Referer': request.headers.get('referer') || '',
			},
		});

		const contentType = upstream.headers.get('content-type') || '';
		const headers = new Headers();
		headers.set('access-control-allow-origin', '*');

		if (contentType.includes('javascript')) {
			const text = await upstream.text();
			const rewritten = rewriteBody(text, url.origin);
			headers.set('content-type', contentType);
			headers.set('cache-control', 'public, max-age=300, s-maxage=300');
			return new Response(rewritten, { status: upstream.status, headers });
		}

		// Images, etc. — pass through
		const ct = upstream.headers.get('content-type');
		if (ct) headers.set('content-type', ct);
		const cc = upstream.headers.get('cache-control');
		if (cc) headers.set('cache-control', cc);
		const body = await upstream.arrayBuffer();
		return new Response(body, { status: upstream.status, headers });
	} catch {
		return new Response('/* clarity proxy: upstream unavailable */', {
			status: 200,
			headers: { 'content-type': 'application/javascript', 'cache-control': 'no-cache' },
		});
	}
};

export const POST: RequestHandler = async ({ params, url, request }) => {
	try {
		const path = params.path;
		if (!path) return new Response('', { status: 204 });

		const upstreamUrl = buildUpstreamUrl(path);
		if (!upstreamUrl) return new Response('', { status: 204 });

		const fullUrl = url.search ? `${upstreamUrl}${url.search}` : upstreamUrl;

		// Read body safely
		let bodyData: Uint8Array | undefined;
		try {
			const buf = await request.arrayBuffer();
			bodyData = buf.byteLength > 0 ? new Uint8Array(buf) : undefined;
		} catch {
			bodyData = undefined;
		}

		// Forward essential headers — Origin must match the project domain
		const upstreamHeaders: Record<string, string> = {
			'Origin': 'https://mirifer.vercel.app',
		};
		const ct = request.headers.get('content-type');
		if (ct) upstreamHeaders['Content-Type'] = ct;
		const ua = request.headers.get('user-agent');
		if (ua) upstreamHeaders['User-Agent'] = ua;

		const upstream = await fetch(fullUrl, {
			method: 'POST',
			headers: upstreamHeaders,
			body: bodyData as BodyInit | undefined,
		});

		// Return response - handle no-body responses (204, etc.)
		const respHeaders = new Headers();
		respHeaders.set('access-control-allow-origin', '*');
		const respCt = upstream.headers.get('content-type');
		if (respCt) respHeaders.set('content-type', respCt);

		if (upstream.status === 204 || !upstream.body) {
			return new Response(null, { status: upstream.status, headers: respHeaders });
		}

		const respBody = await upstream.arrayBuffer();
		return new Response(respBody, { status: upstream.status, headers: respHeaders });
	} catch {
		// Silently accept — Clarity retries on failure
		return new Response('', { status: 204 });
	}
};

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: {
			'access-control-allow-origin': '*',
			'access-control-allow-methods': 'GET, POST, OPTIONS',
			'access-control-allow-headers': 'content-type',
			'access-control-max-age': '86400',
		},
	});
};
