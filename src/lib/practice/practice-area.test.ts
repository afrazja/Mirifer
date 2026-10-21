import { describe, it, expect, beforeEach } from 'vitest';
import { PRACTICE_GROUPS, PRACTICE_IDS, PRACTICE_MODULES, isPracticeId, loadPractice, markTried, savePractice, suggestPractice, triedPractice } from './practice-area';

beforeEach(() => localStorage.clear());

describe('the Practice area', () => {
	it('lists every module once, in a group, with both languages; Choose and persuade waits for its own sets', () => {
		expect(PRACTICE_GROUPS.flatMap(g => g.ids).sort()).toEqual([...PRACTICE_IDS].sort());
		for (const id of PRACTICE_IDS) {
			const item = PRACTICE_MODULES[id];
			expect(item.title.fa).toMatch(/[؀-ۿ]/);
			expect(item.does.fa).toMatch(/[؀-ۿ]/);
			expect(item.href).toBe(id === 'retell' ? '/practice/english/retell' : `/practice/english/practice/${id}`);
		}
		expect(isPracticeId('choose-persuade')).toBe(false);
		// Inside the app it is never named after an exam.
		expect(JSON.stringify([PRACTICE_MODULES, PRACTICE_GROUPS])).not.toMatch(/IELTS|TOEFL/i);
	});
	it('suggests the next module not tried yet, starting easy for Intermediate', () => {
		expect(suggestPractice([], 'intermediate')).toBe('quick-fire');
		expect(suggestPractice([], 'professional')).toBe('speaking-card');
		expect(suggestPractice(['quick-fire'], 'intermediate')).toBe('traps');
		expect(suggestPractice(['quick-fire', 'traps'], 'intermediate')).toBe('dictation');
		// All tried: the one used longest ago.
		expect(suggestPractice(['read-rate', ...PRACTICE_IDS.filter(id => id !== 'read-rate')], 'intermediate')).toBe('read-rate');
	});
	it('keeps runs per account, most recently used last', () => {
		savePractice('a', 'quick-fire', { done: false });
		savePractice('a', 'dictation', { done: true });
		savePractice('b', 'speaking-card', { done: false });
		expect(loadPractice('a', 'quick-fire')).toEqual({ done: false });
		expect(loadPractice('b', 'quick-fire')).toBeNull();
		expect(triedPractice('a')).toEqual(['quick-fire', 'dictation']);
		savePractice('a', 'quick-fire', { done: true });
		expect(triedPractice('a')).toEqual(['dictation', 'quick-fire']);
		markTried('a', 'retell');
		expect(triedPractice('a')).toEqual(['dictation', 'quick-fire', 'retell']);
		expect(triedPractice('b')).toEqual(['speaking-card']);
	});
});
