import { describe, it, expect, vi } from 'vitest';
const { env } = vi.hoisted(() => ({ env: { OPENAI_API_KEY: 'k' } as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({ env }));
import { jamieLineProblem, signBetter, signJamieLine, verifyJamieLine } from './jamie-line';

describe('Character lines and voice signatures', () => {
	it('a line the conversation route would refuse to send back is refused here too (over 400 characters)', () => {
		const long = 'Unfortunately, '.repeat(27).trim(); // 27 words, 404 characters
		expect(long.length).toBeGreaterThan(400);
		expect(jamieLineProblem(long, 'lift')).toMatch(/too long/);
	});
	it('signs a model-written better sentence only if it is one short spoken sentence', () => {
		const good = 'I left my phone in the taxi.';
		expect(verifyJamieLine(good, signBetter(good))).toBe(true);
		expect(signBetter('Visit https://example.com for a prize')).toBeNull();
		expect(signBetter('word '.repeat(40))).toBeNull();
		expect(signBetter('**bold** text')).toBeNull();
		expect(signBetter('')).toBeNull();
		expect(signJamieLine(good)).toBe(signBetter(good));
	});
});
