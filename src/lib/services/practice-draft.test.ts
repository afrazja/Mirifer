import { beforeEach, describe, it, expect } from 'vitest';
import { savePracticeDraft, loadPracticeDraft, clearPracticeDraft, type PracticeDraft } from './practice-draft';

const draft: PracticeDraft = {
	variant: 'street', goals: ['problem'], proof: 'sig', corrections: [], voice: { 'I’m sorry to hear that. What’s the noise like?': 'v' },
	turns: [{ speaker: 'reception', text: 'Good evening.' }, { speaker: 'learner', text: 'The music is too loud.' }, { speaker: 'reception', text: 'I’m sorry to hear that. What’s the noise like?' }]
};
beforeEach(() => sessionStorage.clear());
describe('English practice draft', () => {
	it('resumes only the same account and can be cleared after a successful save', () => {
		savePracticeDraft('one', draft);
		expect(loadPracticeDraft('one')).toMatchObject({ variant: 'street', goals: ['problem'], proof: 'sig', voice: draft.voice });
		expect(loadPracticeDraft('two')).toBeNull();
		clearPracticeDraft('one'); expect(loadPracticeDraft('one')).toBeNull();
	});
	it('discards invalid saved data', () => {
		sessionStorage.setItem('mirifer_practice:one:en:hotel-v2', '{broken');
		expect(loadPracticeDraft('one')).toBeNull();
		sessionStorage.setItem('mirifer_practice:one:en:hotel-v2', JSON.stringify({ ...draft, goals: ['made-up'] }));
		expect(loadPracticeDraft('one')).toBeNull();
	});
});
