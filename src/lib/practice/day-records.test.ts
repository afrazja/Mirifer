import { describe, it, expect } from 'vitest';
import { clearRecords, loadRecord, saveRecord } from './day-records';
import { asConnectRecord, emptyConnectRecord } from './listen-connect';

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
	it('checks a saved Listen and connect record before showing it', () => {
		const ok = { ...emptyConnectRecord(), plays: 1, heard: true, connect: [2, 0, null] };
		expect(asConnectRecord(ok)).toEqual(ok);
		expect(asConnectRecord(null)).toBeNull();
		expect(asConnectRecord({ rounds: [] })).toBeNull(); // the old module's record
		expect(asConnectRecord({ ...ok, plays: 5 })).toBeNull();
		expect(asConnectRecord({ ...ok, connect: [9, 0, 0] })).toBeNull();
	});
});
