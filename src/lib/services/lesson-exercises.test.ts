import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
	parseExercises,
	optionText,
	localized,
	isOptionCorrect,
	fillParts,
	orderTiles,
	isOrderCorrect,
	exerciseAudio
} from './lesson-exercises';

const listen = { id: 'a', type: 'listen', de: 'Wie alt sind Sie?', options: [{ en: 'How old are you?', fa: 'چند سالتان است؟' }, { en: 'What is your name?' }], answer: 0 };
const fill = { id: 'b', type: 'fill', de: 'Ich ___ Ali.', options: ['heiße', 'habe'], answer: 0 };
const order = { id: 'c', type: 'order', de: 'Ich bin Ingenieur.', prompt: { en: 'I am an engineer.' } };
const choice = { id: 'd', type: 'choice', prompt: { en: 'Which asks for a job?' }, options: ['Was sind Sie von Beruf?', 'Woher kommen Sie?'], answer: 0 };

describe('parseExercises', () => {
	it('keeps valid exercises of every type', () => {
		expect(parseExercises([listen, fill, order, choice])?.map((e) => e.type)).toEqual(['listen', 'fill', 'order', 'choice']);
	});

	it('drops a malformed exercise but keeps the rest', () => {
		const dropped: string[] = [];
		const kept = parseExercises([listen, { id: 'x', type: 'fill', de: 'no gap', options: ['a', 'b'], answer: 0 }, order], (m) => dropped.push(m));
		expect(kept?.map((e) => e.id)).toEqual(['a', 'c']);
		expect(dropped).toHaveLength(1);
	});

	it('rejects an answer outside the options', () => {
		expect(parseExercises([{ ...fill, answer: 5 }])).toBeUndefined();
	});

	it('returns undefined for nothing usable', () => {
		expect(parseExercises(null)).toBeUndefined();
		expect(parseExercises([])).toBeUndefined();
		expect(parseExercises('nope')).toBeUndefined();
	});
});

describe('helpers', () => {
	it('picks the option text by language, falling back to English', () => {
		const [a, b] = parseExercises([listen])![0].options!;
		expect(optionText(a, 'fa')).toBe('چند سالتان است؟');
		expect(optionText(b, 'fa')).toBe('What is your name?');
		expect(optionText('heiße', 'fa')).toBe('heiße');
	});

	it('localizes a prompt', () => {
		expect(localized({ en: 'Hi', fa: 'سلام' }, 'fa')).toBe('سلام');
		expect(localized({ en: 'Hi' }, 'fa')).toBe('Hi');
		expect(localized(undefined, 'en')).toBe('');
	});

	it('grades options', () => {
		const ex = parseExercises([fill])![0];
		expect(isOptionCorrect(ex, 0)).toBe(true);
		expect(isOptionCorrect(ex, 1)).toBe(false);
	});

	it('splits a fill sentence at the gap', () => {
		expect(fillParts(parseExercises([fill])![0])).toEqual(['Ich ', ' Ali.']);
	});

	it('shuffles order tiles and grades the arrangement', () => {
		const ex = parseExercises([order])![0];
		const tiles = orderTiles(ex);
		expect([...tiles].sort()).toEqual(['Ich', 'Ingenieur.', 'bin']);
		expect(isOrderCorrect(ex, ['Ich', 'bin', 'Ingenieur.'])).toBe(true);
		expect(isOrderCorrect(ex, ['bin', 'Ich', 'Ingenieur.'])).toBe(false);
	});

	it('says what to play for each type', () => {
		const [l, f, o, c] = parseExercises([listen, fill, order, choice])!;
		expect(exerciseAudio(l)).toBe('Wie alt sind Sie?');
		expect(exerciseAudio(f)).toBe('Ich heiße Ali.');
		expect(exerciseAudio(o)).toBe('Ich bin Ingenieur.');
		expect(exerciseAudio(c)).toBeNull();
	});
});

describe('Lesson 1 content (supabase-lesson-exercises.sql)', () => {
	const sql = readFileSync(resolve(process.cwd(), 'supabase-lesson-exercises.sql'), 'utf8');
	const blocks = [...sql.matchAll(/\$json\$([\s\S]*?)\$json\$/g)].map((m) => JSON.parse(m[1]));

	it('has words, collocations and exercises, all valid', () => {
		const [words, collocations, exercises] = blocks;
		expect(words).toHaveLength(6);
		expect(collocations).toHaveLength(8);
		const dropped: string[] = [];
		const kept = parseExercises(exercises, (m) => dropped.push(m));
		expect(dropped).toEqual([]);
		expect(kept).toHaveLength(exercises.length);
	});

	it('gives every exercise a distinct id and a Persian text where it has an explanation', () => {
		const exercises = parseExercises(blocks[2])!;
		expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length);
		for (const e of exercises) if (e.explain) expect(e.explain.fa).not.toBe('');
	});

	it('does not always put the right answer first', () => {
		const answers = parseExercises(blocks[2])!.filter((e) => e.type !== 'order').map((e) => e.answer);
		expect(new Set(answers).size).toBeGreaterThan(1);
	});
});
