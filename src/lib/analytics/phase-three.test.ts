import { describe, it, expect } from 'vitest';
import { DAY_MS } from './contract';
import { CHECK_PROTOCOL, type Assessment } from './phase-three';
import { checkSchedule, assignedForm } from './assessment-schedule';
import { classifyEntry } from './acquisition';
import { CHECK_FORMS, gradeCheck, publicItems } from '$lib/server/assessment-bank';
const now = Date.parse('2026-09-30T12:00:00Z');
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const iso = (time: number) => new Date(time).toISOString();
const ago = (days: number) => now - days * DAY_MS;
const base = (n = 1, time = ago(20)): Assessment => ({ id:id(100+n), user_id:id(n), protocol:CHECK_PROTOCOL, checkpoint:0, form:'a', baseline_id:null, started_at:iso(time-60000), completed_at:iso(time), listening_correct:2, reading_correct:3, skipped:1 });
const follow = (a: Assessment, time = ago(5)): Assessment => ({ ...a, id:id(201), checkpoint:14, baseline_id:a.id, form:'b', started_at:iso(time-60000), completed_at:iso(time), listening_correct:5, reading_correct:4, skipped:0 });

describe('pilot progress checks', () => {
  it('keeps answer keys server-side and scores only the twelve selected options', () => {
    for (const form of ['a','b'] as const) {
      expect(publicItems(form)).toHaveLength(12);
      expect(publicItems(form).every(q => !('answer' in q))).toBe(true);
      expect(publicItems(form).slice(0,6).every(q => q.text === null && q.audio)).toBe(true);
      expect(gradeCheck(form,CHECK_FORMS[form].map(q => q.answer))).toEqual({listening_correct:6,reading_correct:6,skipped:0});
    }
    expect(gradeCheck('a',Array(12).fill(null))).toEqual({listening_correct:0,reading_correct:0,skipped:12});
    for (const invalid of [[],Array(12).fill(true),Array(12).fill(3),Array(12).fill(-1),{score:12}]) expect(gradeCheck('a',invalid)).toBeNull();
  });
  it('opens each checkpoint at the exact baseline-relative boundary and closes it after its final day', () => {
    const b = base(); const t = Date.parse(b.completed_at!);
    expect(checkSchedule([],now).due).toBe(0);
    expect(checkSchedule([{...b,completed_at:null}],now).due).toBe(0);
    expect(checkSchedule([b],t+14*DAY_MS-1).due).toBeNull();
    expect(checkSchedule([b],t+14*DAY_MS).due).toBe(14);
    expect(checkSchedule([b],t+30*DAY_MS-1).due).toBe(14);
    expect(checkSchedule([b],t+30*DAY_MS).due).toBe(30);
    expect(checkSchedule([b],t+60*DAY_MS)).toMatchObject({due:null,missed:[14,30],nextAt:iso(t+90*DAY_MS)});
    expect(checkSchedule([b],t+210*DAY_MS)).toMatchObject({due:null,nextAt:null,missed:[14,30,90,180]});
  });
  it('does not reopen a saved checkpoint and alternates question forms reproducibly', () => {
    const b = base(); expect(checkSchedule([b,follow(b)],now).due).toBeNull();
    expect(assignedForm(id(1),0)).not.toBe(assignedForm(id(1),14));
    expect(assignedForm(id(1),0)).toBe(assignedForm(id(1),30));
    expect(assignedForm(id(1),0)).not.toBe(assignedForm(id(2),0));
  });
});

describe('signup attribution and comparable outcomes', () => {
  it('classifies tags before referrers without retaining private text or hostname lookalikes', () => {
    expect(classifyEntry('https://www.mirifer.com/?utm_source=friend&email=private@example.test','https://google.com/search?q=private',now)).toMatchObject({source:'friend',method:'tag'});
    expect(classifyEntry('https://www.mirifer.com/?utm_source=private@example.test','',now)).toMatchObject({source:'unknown',method:'tag'});
    expect(classifyEntry('https://www.mirifer.com/','https://evilgoogle.com/',now).source).toBe('other_referral');
    expect(classifyEntry('https://www.mirifer.com/','https://www.google.com/',now).source).toBe('google');
    expect(classifyEntry('https://www.mirifer.com/','https://mirifer.com/home',now).source).toBe('direct');
    expect(JSON.stringify(classifyEntry('https://www.mirifer.com/','https://unknown.test/private?email=a@b.test',now))).not.toContain('unknown.test');
  });
});
