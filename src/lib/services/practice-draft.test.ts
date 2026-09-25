import { beforeEach, describe, it, expect } from 'vitest';
import { savePracticeDraft, loadPracticeDraft, clearPracticeDraft } from './practice-draft';

beforeEach(() => sessionStorage.clear());
describe('English practice draft', () => {
	it('resumes only the same account and can be cleared after a successful save', () => {
		savePracticeDraft('one', 'street', ['My room is too noisy.', '204'], ['problem']);
		expect(loadPracticeDraft('one')).toMatchObject({ variant: 'street', replies: ['My room is too noisy.', '204'] });
		expect(loadPracticeDraft('two')).toBeNull();
		clearPracticeDraft('one'); expect(loadPracticeDraft('one')).toBeNull();
	});
	it('discards invalid or out-of-order saved conversation data', () => {
		savePracticeDraft('one', 'lift', ['Yes, thank you.'], []);
		expect(loadPracticeDraft('one')).toBeNull();
		sessionStorage.setItem('mirifer_practice:one:en:hotel-v1', '{broken');
		expect(loadPracticeDraft('one')).toBeNull();
	});
	it('resumes a valid AI-classified paraphrase at the same authored step', () => {
		savePracticeDraft('one', 'lift', ['The music kept me awake all night.', '204'], [], ['noise', null]);
		expect(loadPracticeDraft('one')?.resolved).toEqual(['noise', null]);
		savePracticeDraft('one', 'lift', ['The music kept me awake all night.'], [], ['accept']);
		expect(loadPracticeDraft('one')).toBeNull();
	});
});
