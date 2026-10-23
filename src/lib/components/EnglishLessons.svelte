<script lang="ts">
	/** Admin: the English daily lessons (src/lib/analytics/english-lessons-report.ts). */
	import type { EnglishLessonReport } from '$lib/analytics/english-lessons-report';
	import { rate } from '$lib/analytics/statistics';
	let { report }: { report: EnglishLessonReport } = $props();
	const NAMES: Record<string, string> = {
		'listen-act': 'Listen and connect', 'listen-retell': 'Listen and retell', phrases: 'Natural phrases', traps: 'Persian-speaker traps',
		'say-in-english': 'Say it in English', 'voice-messages': 'Voice messages', 'say-it-better': 'Tell your story / Say it better',
		'choose-persuade': 'Choose and persuade', scenario: 'Role-play'
	};
	const version = (track: string) => (track === 'professional' ? 'Professional' : 'Intermediate');
</script>

<div class="analysis-view">
	<div class="analysis-heading"><div><span class="analysis-eyebrow">ENGLISH DAILY LESSONS</span><h2>Do learners finish, and do they come back?</h2><p>From the lesson checkpoints the server saves. Days are each learner’s own calendar days.</p></div></div>
	<div class="analysis-metrics">
		<article><span>Lessons started</span><strong>{report.started}</strong><small>In the selected period</small></article>
		<article><span>Lessons finished</span><strong>{report.completed} <em>/ {report.started}</em></strong><small>{rate(report.completed, report.started)}</small></article>
		<article><span>Came back the next day</span><strong>{report.nextDay.returned} <em>/ {report.nextDay.eligible}</em></strong><small>{rate(report.nextDay.returned, report.nextDay.eligible)} · {report.nextDay.pending} still pending</small></article>
		<article><span>Came back within a week</span><strong>{report.week.returned} <em>/ {report.week.eligible}</em></strong><small>{rate(report.week.returned, report.week.eligible)} · {report.week.pending} still pending</small></article>
	</div>
	<p class="analysis-note">Returns count the {report.newLearners} learners whose first lesson was in this period. A learner counts only once the whole day or week after their first lesson has passed. With few learners, read these as signals, not proof.</p>

	<div class="analysis-heading"><div><h3>By day and version</h3></div></div>
	<div class="analysis-table"><table><caption class="sr-only">Lessons started and finished by day and version</caption><thead><tr><th>Lesson</th><th>Started</th><th>Finished</th></tr></thead><tbody>
		{#each report.days as row}<tr><td>Day {row.day} <small>{version(row.track)}</small></td><td>{row.started}</td><td>{row.completed} <small>{rate(row.completed, row.started)}</small></td></tr>
		{:else}<tr><td colspan="3" class="analysis-empty">No English lesson has started in this period.</td></tr>{/each}
	</tbody></table></div>

	<div class="analysis-heading"><div><h3>Steps: done or skipped</h3></div></div>
	<div class="analysis-table"><table><caption class="sr-only">Each step, done or skipped</caption><thead><tr><th>Step</th><th>Done</th><th>Skipped</th></tr></thead><tbody>
		{#each report.steps as step}<tr><td>{step.index + 1}. {NAMES[step.module] ?? step.module} <small>Day {step.day} · {version(step.track)}</small></td><td>{step.done}</td><td>{step.skipped} <small>{rate(step.skipped, step.done + step.skipped)}</small></td></tr>
		{:else}<tr><td colspan="3" class="analysis-empty">No step was done or skipped in this period.</td></tr>{/each}
	</tbody></table></div>

	<div class="analysis-heading"><div><h3>Where unfinished lessons stopped</h3><p>Lessons with no save for a day, by the step the learner didn’t finish.</p></div></div>
	<div class="analysis-table"><table><caption class="sr-only">Where unfinished lessons stopped</caption><thead><tr><th>Lesson</th><th>Stopped at</th><th>Lessons</th></tr></thead><tbody>
		{#each report.stops as stop}<tr><td>Day {stop.day} <small>{version(stop.track)}</small></td><td>{stop.atRecap ? 'The recap' : `Step ${stop.step}`}</td><td>{stop.count}</td></tr>
		{:else}<tr><td colspan="3" class="analysis-empty">No unfinished lesson in this period.</td></tr>{/each}
	</tbody></table></div>
</div>

<style>
	/* The version sits under the day or step name, so the tables fit a phone. */
	td small { display: block; color: #a9b4b0; font-size: .78rem; }
</style>
