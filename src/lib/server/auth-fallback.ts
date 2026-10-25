/**
 * Shared checks for the server routes that stand in for the browser's own calls to Supabase
 * (src/routes/auth/*): sign-in, sign-up, password reset, new password. They are a fallback for a
 * filtered or unstable connection that loses those calls (src/lib/services/auth.ts).
 */
import { json } from '@sveltejs/kit';
import { createLimiter } from './rate-limit';

/** Only from our own pages: no other site can sign a visitor in, up or out of an account. */
export function fromOurPages(request: Request, url: URL): Response | null {
	const origin = request.headers.get('origin');
	return origin && origin !== url.origin ? json({ error: 'Not allowed' }, { status: 403 }) : null;
}

/** The caller's address, for the per-address limits. */
export function addressOf(getClientAddress: () => string): string {
	try { return getClientAddress(); } catch { return 'unknown'; }
}

/** Limits per address and per email, against guessing passwords or sending floods of email through us. */
export function limits(perAddressMax: number, perEmailMax: number, windowMs = 10 * 60_000) {
	const byAddress = createLimiter(perAddressMax, windowMs), byEmail = createLimiter(perEmailMax, windowMs);
	return (address: string, email: string): Response | null =>
		byAddress(address) && byEmail(email.toLowerCase()) ? null : json({ error: 'Too many tries. Wait a few minutes and try again.' }, { status: 429 });
}

/** Reads and checks a JSON body; null if it doesn't match. */
export async function bodyOf<T>(request: Request, schema: { parse: (value: unknown) => T }): Promise<T | null> {
	try { return schema.parse(await request.json()); } catch { return null; }
}
