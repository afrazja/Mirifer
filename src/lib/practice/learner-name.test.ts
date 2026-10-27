import { describe, expect, it } from 'vitest';
import { firstName, withName } from './learner-name';

describe('the learner’s name in model answers', () => {
	it('uses the first name, or a stand-in', () => {
		expect(firstName('  Ali Karimi ')).toBe('Ali');
		expect(withName({ model: "Hi, I'm {name}, in 3C.", found: /hi/ }, 'Ali Karimi').model).toBe("Hi, I'm Ali, in 3C.");
		expect(withName(["It's {name}."], '').at(0)).toBe("It's Sam.");
	});
	it('leaves patterns and other values alone', () => {
		const found = /\bhi\b/;
		const out = withName({ found, n: 3, list: ['{name}'] }, 'Ali');
		expect(out.found).toBe(found);
		expect(out.n).toBe(3);
		expect(out.list).toEqual(['Ali']);
	});
});
