/**
 * Coming back to the app after a break starts at the language page, not in
 * the middle of the last module (browsers reopen the last tab on restart).
 * A reload or a quick tab switch still continues where the learner was.
 *
 * The first check runs in app.html before the page paints; keep its key,
 * time and routes in step with this file.
 */
import { needsCourse } from '$lib/courses';

export const LAST_ACTIVE_KEY = 'mirifer_last_active';
/** Away longer than this counts as a new visit. */
export const AWAY_MS = 30 * 60_000;

/** True when this learning page should give way to the language page. A browser with no record yet is left alone. */
export function cameBack(pathname: string, lastActive: string | null, now = Date.now()): boolean {
	const last = Number(lastActive);
	return needsCourse(pathname) && !!lastActive && Number.isFinite(last) && now - last > AWAY_MS;
}

export function markActive(now = Date.now()): void {
	try { localStorage.setItem(LAST_ACTIVE_KEY, String(now)); } catch { /* private mode: every visit continues */ }
}

function lastActive(): string | null {
	try { return localStorage.getItem(LAST_ACTIVE_KEY); } catch { return null; }
}

/** Keeps the record fresh while the learner is here; calls `onReturn` when they come back to a learning page after a break. */
export function trackActivity(onReturn: () => void): () => void {
	let lastMark = 0;
	const touch = () => { const now = Date.now(); if (now - lastMark > 30_000) { lastMark = now; markActive(now); } };
	const onVisibility = () => {
		if (document.visibilityState === 'hidden') { lastMark = Date.now(); markActive(lastMark); return; }
		if (cameBack(location.pathname, lastActive())) onReturn();
		lastMark = Date.now(); markActive(lastMark);
	};
	const onLeave = () => markActive();
	markActive(); lastMark = Date.now();
	window.addEventListener('pointerdown', touch, { passive: true });
	window.addEventListener('keydown', touch);
	window.addEventListener('pagehide', onLeave);
	document.addEventListener('visibilitychange', onVisibility);
	return () => {
		window.removeEventListener('pointerdown', touch);
		window.removeEventListener('keydown', touch);
		window.removeEventListener('pagehide', onLeave);
		document.removeEventListener('visibilitychange', onVisibility);
	};
}
