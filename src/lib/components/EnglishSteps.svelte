<script lang="ts">
	/**
	 * Admin: the steps of the English path (src/lib/analytics/english-usage-report.ts): each chapter's
	 * steps, opened, done, skipped, left and paused, with result, time and rating; the same by step
	 * type; and, folded away, the old daily lessons' report. Rates with fewer than 5 learners behind
	 * them are greyed: one learner can move them a long way.
	 */
	import type { UsageReport } from '$lib/analytics/english-usage-report';
	import type { EnglishLessonReport } from '$lib/analytics/english-lessons-report';
	import EnglishLessons from '$components/EnglishLessons.svelte';
	import { DAYS } from '$lib/practice/day';

	let { usage, lessons }: { usage: UsageReport; lessons: EnglishLessonReport } = $props();
	const NAMES: Record<string, string> = {
		'listen-act': 'Listen and connect', 'listen-retell': 'Listen and retell', phrases: 'Natural phrases', traps: 'Persian-speaker traps',
		'say-in-english': 'Say it in English', 'voice-messages': 'Voice messages', 'say-it-better': 'Say it again, better',
		'choose-persuade': 'Choose and persuade', scenario: 'Role-play', 'group-chat': 'Group chat'
	};
	/** "Travel 2", "Everyday 1": a chapter by its place in its own story. */
	function chapter(day: number) {
		const pack = DAYS.find(d => d.number === day);
		if (!pack) return `Day ${day}`;
		const arc = pack.arc ?? 'travel';
		const n = DAYS.filter(d => (d.arc ?? 'travel') === arc).indexOf(pack) + 1;
		return `${arc === 'travel' ? 'Travel' : arc === 'everyday' ? 'Everyday' : arc} ${n}`;
	}
	const version = (track: string) => (track === 'professional' ? 'Professional' : 'Intermediate');
	const time = (s: number | null) => (s === null ? '–' : s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60 ? `${s % 60} s` : ''}`.trim());
	/** A share, greyed when fewer than 5 are behind it. */
	const share = (n: number, of: number) => ({ text: of ? `${Math.round((n / of) * 100)}%` : '', thin: of < 5 });
</script>

<div class="analysis-view">
	<div class="analysis-heading"><div><span class="analysis-eyebrow">THE STEP PATH</span><h2>Which steps do learners finish, skip or leave?</h2>
		<p>Each chapter's steps in each version, first time only (replays are counted apart). <b>Left</b>: opened, then nothing from that learner for a day. <b>Paused now</b>: under way in a learner's saved path for over a day. Most left or skipped first. Rates with fewer than 5 learners behind them are grey. Openings and times are kept from 29 Oct, so earlier steps show as done without being opened.</p></div></div>

	<div class="analysis-table"><table><caption class="sr-only">Each step: opened, done, skipped, left, result, time, rating</caption>
		<thead><tr><th>Step</th><th>Opened</th><th>Done</th><th>Skipped</th><th>Left</th><th>Paused now</th><th>Replays</th><th>Result</th><th>Time (median)</th><th>Rating</th></tr></thead>
		<tbody>
			{#each usage.steps as row}
				{@const reached = Math.max(row.opened, row.done + row.skipped + row.left)}
				{@const skip = share(row.skipped, reached)}
				{@const left = share(row.left, reached)}
				<tr>
					<td>{row.index + 1}. {NAMES[row.module] ?? row.module} <small>{chapter(row.day)} · {version(row.track)}</small></td>
					<td>{row.opened}</td>
					<td>{row.done}</td>
					<td>{row.skipped} {#if row.skipped}<small class:thin={skip.thin}>{skip.text}</small>{/if}</td>
					<td>{row.left} {#if row.left}<small class:thin={left.thin}>{left.text}</small>{/if}</td>
					<td>{row.paused || '–'}</td>
					<td>{row.replays || '–'}</td>
					<td>{row.score === null ? '–' : `${row.score}%`}</td>
					<td>{time(row.seconds)} {#if row.timed}<small class:thin={row.timed < 5}>{row.timed} timed</small>{/if}</td>
					<td>{row.rating === null ? '–' : row.rating.toFixed(1)} {#if row.ratings}<small class:thin={row.ratings < 5}>{row.ratings} rated</small>{/if}</td>
				</tr>
			{:else}<tr><td colspan="10" class="analysis-empty">No step was opened or done in this period.</td></tr>{/each}
		</tbody>
	</table></div>

	<div class="analysis-heading"><div><h3>By step type</h3><p>All chapters together.</p></div></div>
	<div class="analysis-table"><table><caption class="sr-only">Each step type across chapters</caption>
		<thead><tr><th>Step type</th><th>Opened</th><th>Done</th><th>Skipped</th><th>Left</th><th>Replays</th><th>Time (median)</th></tr></thead>
		<tbody>
			{#each usage.byType as row}
				<tr><td>{NAMES[row.module] ?? row.module}</td><td>{row.opened}</td><td>{row.done}</td><td>{row.skipped}</td><td>{row.left}</td><td>{row.replays || '–'}</td><td>{time(row.seconds)} {#if row.timed}<small class:thin={row.timed < 5}>{row.timed} timed</small>{/if}</td></tr>
			{:else}<tr><td colspan="7" class="analysis-empty">Nothing yet.</td></tr>{/each}
		</tbody>
	</table></div>

	<details class="before">
		<summary>Before the step path: the daily lessons</summary>
		<EnglishLessons report={lessons} />
	</details>
</div>

<style>
	td small { display: block; color: #a9b4b0; font-size: .78rem; }
	td small.thin { opacity: .55; }
	.before { margin-top: 26px; }
	.before summary { cursor: pointer; color: #b6dd94; font-weight: 600; min-height: 44px; display: flex; align-items: center; }
</style>
