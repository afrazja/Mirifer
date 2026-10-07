import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { AWAY_MS, LAST_ACTIVE_KEY, cameBack, markActive, trackActivity } from './away';

const now = 1_800_000_000_000;

describe('coming back after a break', () => {
	it('sends a learning page to the language page only after a long break', () => {
		expect(cameBack('/practice/english/today', String(now - AWAY_MS - 1), now)).toBe(true);
		expect(cameBack('/lesson', String(now - 2 * 3600_000), now)).toBe(true);
		expect(cameBack('/practice/english/today', String(now - 5 * 60_000), now)).toBe(false);
	});
	it('leaves other pages and browsers with no record alone', () => {
		expect(cameBack('/languages', String(now - 9 * AWAY_MS), now)).toBe(false);
		expect(cameBack('/settings', String(now - 9 * AWAY_MS), now)).toBe(false);
		expect(cameBack('/practice/english/today', null, now)).toBe(false);
		expect(cameBack('/practice/english/today', 'junk', now)).toBe(false);
	});
	it('returns to the language page when the tab is shown again after a break', () => {
		let returned = 0;
		const stop = trackActivity(() => (returned += 1));
		history.replaceState(null, '', '/practice/english/today');
		markActive(Date.now() - AWAY_MS - 1000);
		Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
		document.dispatchEvent(new Event('visibilitychange'));
		expect(returned).toBe(1);
		document.dispatchEvent(new Event('visibilitychange'));
		expect(returned).toBe(1);
		stop();
	});
	it('the check before first paint uses the same key, time and routes', () => {
		const html = readFileSync('src/app.html', 'utf8');
		expect(html).toContain(`'${LAST_ACTIVE_KEY}'`);
		expect(html).toContain(String(AWAY_MS));
		expect(html).toContain('home|lesson|lessons|review|vocabulary|drill|check-in|practice');
	});
});
