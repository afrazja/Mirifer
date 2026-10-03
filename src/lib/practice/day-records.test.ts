import { describe, it, expect } from 'vitest';
import { clearRecords, loadRecord, saveRecord } from './day-records';
import { ACT_ROUNDS, asActRecord } from './listen-act';

describe('saved module records', () => {
	it('keeps a record for its own session only', () => {
		saveRecord('s1', 'listen-act', { rounds: [] });
		expect(loadRecord('s1', 'listen-act')).toEqual({ rounds: [] });
		expect(loadRecord('s2', 'listen-act')).toBeNull();
		expect(loadRecord('s1', 'other')).toBeNull();
		saveRecord('s2', 'say-it-better', { x: 1 });
		expect(loadRecord('s1', 'listen-act')).toBeNull();
		clearRecords(); expect(loadRecord('s2', 'say-it-better')).toBeNull();
	});
	it('survives damaged storage', () => {
		localStorage.setItem('mirifer_en_day_records_v1', '{nope');
		expect(loadRecord('s1', 'listen-act')).toBeNull();
		saveRecord('s1', 'listen-act', { rounds: [] }); expect(loadRecord('s1', 'listen-act')).toEqual({ rounds: [] });
	});
	it('refuses oversized records instead of filling storage', () => {
		saveRecord('s1', 'big', 'x'.repeat(300_000)); expect(loadRecord('s1', 'big')).toBeNull();
	});
	it('checks a saved Listen and act record before showing it', () => {
		const ok = { rounds: [{ id: ACT_ROUNDS[0].id, steps: ACT_ROUNDS[0].steps, results: [true, true, true] }] };
		expect(asActRecord(ok)).toEqual(ok);
		expect(asActRecord(null)).toBeNull();
		expect(asActRecord({ rounds: [{ id: 'nope', steps: [], results: [] }] })).toBeNull();
		expect(asActRecord({ rounds: [{ id: ACT_ROUNDS[0].id, steps: [{ thing: 'x', place: 'desk' }], results: [] }] })).toBeNull();
	});
});
