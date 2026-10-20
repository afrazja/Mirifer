<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { tick } from 'svelte';
	import type { StoredEvent } from '$lib/analytics/contract';
	import LessonAnalysis from '$components/LessonAnalysis.svelte';
	import ReturnVisits from '$components/ReturnVisits.svelte';
	import EnglishLessons from '$components/EnglishLessons.svelte';
	import LearningChecks from '$components/LearningChecks.svelte';
	import AcquisitionSources from '$components/AcquisitionSources.svelte';
	import ChangesResults from '$components/ChangesResults.svelte';
	import '$components/insights-analysis.css';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let tab = $state('overview');
	let selectedId = $state('');
	let search = $state('');
	$effect(() => { tab = data.tab; });
	const report = $derived(data.insights?.report ?? null);
	const learners = $derived(report?.learners.filter(u => `${u.label} ${u.id}`.toLowerCase().includes(search.toLowerCase())) ?? []);
	const selected = $derived(learners.find(u => u.id === selectedId) ?? learners[0]);
	const tabs = [{ id: 'overview', name: 'Overview' }, { id: 'journeys', name: 'Learner Journeys' }, { id: 'lessons', name: 'Lesson Analysis' }, { id: 'returns', name: 'Return Visits' }, { id: 'english', name: 'English Lessons' }, { id: 'assessments', name: 'Learning Checks' }, { id: 'sources', name: 'Acquisition Sources' }, { id: 'changes', name: 'Changes & Results' }, { id: 'obstacles', name: 'Obstacles' }, { id: 'quality', name: 'Data Quality' }];
	const percent = (n: number, d: number) => d ? `${Math.round(n / d * 100)}%` : 'Not available';
	const date = (value: string | null | undefined) => value ? new Date(value).toLocaleString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' UTC' : 'Not available';
	const labels: Record<string, string> = { visit_started: 'Visit started', page_viewed: 'Viewed page', page_hidden: 'Page hidden', page_returned: 'Returned to page', lesson_started: 'Opened lesson', lesson_begun: 'Pressed Start', lesson_resumed: 'Resumed lesson', lesson_progress: 'Saw sentence', answer_submitted: 'Submitted answer', step_skipped: 'Skipped sentence', lesson_attempt_completed: 'Finished lesson attempt', lesson_completed: 'First completion of this lesson', mic_requested: 'Requested microphone', mic_ready: 'Microphone ready', obstacle: 'Technical obstacle', audio_fallback: 'Switched to backup audio' };
	function eventLabel(e: StoredEvent) {
		if (e.event_name === 'lesson_active') return `Active dialogue time · ${Math.round(Number(e.metadata.active_ms ?? 0) / 1000)}s`;
		const newLabels: Record<string, string> = { hint_opened: 'Opened hint', answer_revealed: 'Revealed answer', audio_replayed: 'Requested audio replay', sentence_practice_opened: 'Opened sentence practice' };
		if (newLabels[e.event_name]) return newLabels[e.event_name];
		if (e.event_name === 'obstacle') return report?.obstacles.find(o => o.code === e.metadata.code)?.label ?? 'Technical obstacle';
		if (e.event_name === 'answer_submitted') return e.metadata.correct === true ? 'Answered correctly' : 'Answer needs another try';
		return labels[e.event_name] ?? e.event_name.replaceAll('_', ' ');
	}
	async function inspect(id: string) {
		selectedId = id; search = ''; tab = 'journeys';
		await tick(); document.querySelector('.journey-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<svelte:head><title>Learner Insights · Mirifer Admin</title></svelte:head>

{#if !data.authorized}
	<div class="login-wrap">
		<form method="POST" action="?/login" class="panel login-card">
			<span class="eyebrow">MIRIFER ADMIN</span>
			<h1>Learner Insights</h1>
			<p class="muted">Sign in with your configured administrator credentials.</p>
			{#if form && 'error' in form}<p class="notice error" role="alert">{form.error}</p>{/if}
			<label for="admin-email">Email</label>
			<input id="admin-email" name="email" type="email" required autocomplete="username" />
			<label for="admin-password">Password</label>
			<input id="admin-password" name="password" type="password" required autocomplete="current-password" />
			<button type="submit" class="primary">Sign in</button>
		</form>
	</div>
{:else}
	<div class="insights">
		{#if data.preview}<p class="notice">LOCAL PREVIEW - Fictional learners and events. These are not live Mirifer statistics.</p>{/if}
		<header class="heading">
			<div><span class="eyebrow">MIRIFER / LEARNER INSIGHTS</span><h1>Make the first lesson count.</h1><p class="muted">See what learners do, where they stop, and what needs attention.</p></div>
			<form method="POST" action="?/logout"><button class="quiet">Sign out</button></form>
		</header>
		<div class="toolbar">
			<form method="GET" class="filters">
				<input type="hidden" name="tab" value={tab} />
				<label for="period">Period</label>
				<select id="period" name="days" value={String(report?.days ?? 30)}><option value="7">Last 7 days</option><option value="14">Last 14 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>
				<label class="check"><input type="checkbox" name="tests" value="1" checked={report?.includeTests ?? false} /> Include test accounts</label>
				<button class="quiet" type="submit">Refresh report</button>
			</form>
			<span class:waiting={!report?.quality.latestReceived} class="status"><span class="dot"></span>{!report ? 'Setup required' : report.quality.latestReceived ? 'Connected · snapshot below' : 'Waiting for first event'}</span>
		</div>
		<nav class="tabs" aria-label="Insights views">{#each tabs as item}<button class:current={tab === item.id} aria-pressed={tab === item.id} onclick={() => tab = item.id}>{item.name}</button>{/each}</nav>
		{#if form && 'error' in form}<p class="notice error" role="alert">{form.error}</p>{/if}
		{#if form && 'success' in form}<p class="notice" role="status">{form.success}</p>{/if}
		{#if !report}
			<section class="panel empty" aria-live="polite">
				<span class="eyebrow">DATA IS NOT AVAILABLE YET</span><h2>Connect the collection foundation.</h2>
				<p>{data.insights?.reason}</p>
				<p class="muted">Apply <code>supabase-learner-insights.sql</code>, set the private server key, and deploy this release. Then complete one test journey and refresh this page.</p>
				<p class="muted">No partial or sample totals are shown here. Existing events cannot tell us every past visit or where an earlier learner left.</p>
			</section>
		{:else if tab === 'overview'}
			<div class="metrics">
				<article class="panel metric"><span>New accounts</span><strong>{report.newUsers}</strong><small>Signed up in this period</small></article>
				<article class="panel metric"><span>Active learners</span><strong>{report.activeLearners}</strong><small>Submitted an answer, spoke a free turn, or finished an exam</small></article>
				<article class="panel metric"><span>Tracked visits</span><strong>{report.visits}</strong><small>From {report.visitors} distinct learners</small></article>
				<article class="panel metric"><span>Learners with an obstacle</span><strong>{report.affectedUsers}<em> / {report.visitors}</em></strong><small>{percent(report.affectedUsers, report.visitors)} of tracked visitors</small></article>
			</div>
			<div class="overview-grid">
				<section class="panel">
					<div class="section-heading"><div><span class="eyebrow">ACTIVATION</span><h2>The first visit</h2></div><span class="badge">{report.funnel[0].count} eligible signups</span></div>
					<p class="muted">New accounts created after tracking began, within this period. Lesson steps must happen in order, in the same attempt and first visit.</p>
					<div class="funnel">{#each report.funnel as step, i}
						<div class="funnel-row"><div class="funnel-label"><span>{i + 1}. {step.label}</span><span><b>{step.count}</b> <small>{percent(step.count, report.funnel[0].count)}</small></span></div><div class="track"><div style:width={`${report.funnel[0].count ? step.count / report.funnel[0].count * 100 : 0}%`}></div></div>
						{#if i > 0}<small class="muted">{report.funnel[i - 1].count - step.count} did not reach this step in that sequence</small>{/if}</div>
					{/each}</div>
					<p class="footnote">{report.eventual} of these learners finished a lesson across any tracked visit. A missing step shows what was not observed; it does not prove why someone left.</p>
				</section>
				<div class="stack">
					<section class="panel"><span class="eyebrow">RETURN TO PRACTICE</span><h2>Seven-day return</h2><div class="big-number">{percent(report.returned, report.eligible)}</div><p><b>{report.returned} / {report.eligible}</b> eligible learners returned.</p><p class="muted">A second learning visit 24 hours to 7 days after the first. Only tracked new accounts in this signup cohort with a full 7-day observation window qualify.</p>{#if !report.eligible}<p class="notice">No eligible learners yet. This is not a 0% return rate.</p>{/if}</section>
					<section class="panel"><span class="eyebrow">NEXT INVESTIGATION</span><h2>{report.obstacles[0]?.affected ? report.obstacles[0].label : 'Follow the first journey'}</h2><p class="muted">{report.obstacles[0]?.affected ? `${report.obstacles[0].affected} learners encountered this obstacle. Inspect the events before and after it.` : 'Inspect a learner’s sequence to see their last observed sentence, retries, and return visits.'}</p><button class="text-button" onclick={() => tab = report.obstacles[0]?.affected ? 'obstacles' : 'journeys'}>Open investigation →</button></section>
				</div>
			</div>
		{:else if tab === 'journeys'}
			<div class="section-heading"><div><span class="eyebrow">INDIVIDUAL BEHAVIOR</span><h2>Learner Journeys</h2><p class="muted">Visits and active days refer to the selected period. Last observed activity is not a confirmed exit.</p></div><label class="search">Find learner<input aria-label="Find learner by ID" placeholder="Learner ID" bind:value={search} /></label></div>
			<div class="panel table-wrap"><table><thead><tr><th>Learner / signup</th><th>Visits</th><th>Learning days</th><th>Attempts / finished</th><th>Last observed step</th></tr></thead><tbody>
				{#each learners as u}<tr class:selected={selected?.id === u.id}><td><button class="text-button" onclick={() => selectedId = u.id}>{u.label}</button>{#if u.excluded}<span class="badge">Test</span>{/if}<small>{date(u.signup)}</small></td><td>{u.visits.length}</td><td>{u.activeDays}</td><td>{u.attempts} / {u.completed}</td><td>{u.last ? eventLabel(u.last) : 'No activity recorded'}<small>{date(u.last?.occurred_at)}</small></td></tr>{:else}<tr><td colspan="5" class="empty-cell">No matching learners in this period.</td></tr>{/each}
			</tbody></table></div>
			{#if selected}
				<section class="panel journey-detail"><div class="section-heading"><div><span class="eyebrow">VISIT TIMELINE</span><h2>{selected.label}</h2><p class="muted mono">{selected.id}</p></div>
					{#if selected.automaticExclusion}<span class="badge">Administrator · automatically excluded</span>{:else}<form method="POST" action={`?/exclude&days=${report.days}&tests=${report.includeTests ? 1 : 0}&tab=journeys`}><input type="hidden" name="user_id" value={selected.id} /><input type="hidden" name="exclude" value={selected.manualExclusion ? '0' : '1'} /><button class="quiet">{selected.manualExclusion ? 'Remove test label' : 'Mark as test account'}</button></form>{/if}</div>
					{#each selected.visits.toReversed() as visit}<details class="visit" open={visit.id === selected.visits.at(-1)?.id}><summary><span>{date(visit.first)}</span><span class="badge">{visit.learning ? 'Learning visit' : 'Browsing visit'}</span><span>{visit.events.length} events</span></summary><p class="muted visit-meta">Visit {visit.id.slice(0, 8)} · {visit.events[0].metadata.device ?? 'Device unknown'} · {visit.events[0].metadata.browser ?? 'Browser unknown'} · Interface: {visit.events[0].metadata.language ?? 'unknown'}</p><ol class="timeline">
						{#each visit.events as event}<li class:problem={event.event_name === 'obstacle'}><time>{date(event.occurred_at)}</time><div><b>{eventLabel(event)}</b><span>{event.metadata.page ?? 'Page unknown'}{#if event.day} · Day {event.day}{/if}{#if typeof event.metadata.index === 'number'} · Sentence {event.metadata.index + 1}{/if}{#if event.attempt_id} · Attempt {event.attempt_id.slice(0, 8)}{/if}</span></div></li>{/each}
					</ol></details>{:else}<p class="muted">This account has no recorded visit in this period. Earlier activity cannot be reconstructed.</p>{/each}
				</section>
			{/if}
		{:else if tab === 'lessons'}
			<LessonAnalysis report={report.lessonAnalysis} inspect={inspect} />
		{:else if tab === 'returns'}
			<ReturnVisits report={report.returnVisits} inspect={inspect} />
		{:else if tab === 'english'}
			<EnglishLessons report={report.englishLessons} />
		{:else if ['assessments', 'sources', 'changes'].includes(tab)}
			{#if report.phaseThree.error}<p class="notice error">{report.phaseThree.error}</p>
			{:else if tab === 'assessments'}<LearningChecks report={report.phaseThree.assessments} {inspect} />
			{:else if tab === 'sources'}<AcquisitionSources report={report.phaseThree.acquisition} {inspect} />
			{:else}<ChangesResults changes={report.phaseThree.changes} days={report.days} includeTests={report.includeTests} />{/if}
		{:else if tab === 'obstacles'}
			<div class="section-heading"><div><span class="eyebrow">TECHNICAL FRICTION</span><h2>Where practice gets interrupted</h2><p class="muted">Affected learners are counted once per obstacle. Percentages use all {report.visitors} tracked visitors in this period.</p></div></div>
			<div class="panel table-wrap"><table><thead><tr><th>Obstacle</th><th>Affected learners</th><th>Occurrences</th><th>Inspect a journey</th></tr></thead><tbody>{#each report.obstacles as o}<tr><td>{o.label}</td><td><b>{o.affected} / {report.visitors}</b><small>{percent(o.affected, report.visitors)}</small></td><td>{o.count}</td><td>{#if o.userIds.length}<button class="text-button" onclick={() => inspect(o.userIds[0])}>View learner →</button>{:else}<span class="muted">None recorded</span>{/if}</td></tr>{/each}</tbody></table></div>
			<div class="two-col"><section class="panel"><h3>Learning difficulty</h3><p><b>{report.incorrectAnswers}</b> answers needed another try.</p><p class="muted">Incorrect German is a learning signal. It is excluded from technical obstacle counts.</p></section><section class="panel"><h3>Audio recovery</h3><p><b>{report.audioFallbacks}</b> learners switched to backup audio.</p><p class="muted">A fallback is a recovery attempt. Only an observed playback failure is counted as an audio obstacle.</p></section></div>
			<p class="footnote">An obstacle followed by inactivity is a lead to investigate, not proof of the reason for leaving. Browser or network failures can also prevent an event from reaching the server.</p>
		{:else}
			<div class="section-heading"><div><span class="eyebrow">TRUST THE MEASUREMENT</span><h2>Data Quality</h2><p class="muted">Collection health, coverage, and the limits of this report.</p></div><span class="badge">Event schema v2</span></div>
			<p class="notice">Pass two measurements: {report.lessonAnalysis.firstEnhancedEvent ? `first content-versioned event received for activity at ${date(report.lessonAnalysis.firstEnhancedEvent)}` : 'waiting for the first content-versioned lesson event'}. Hints, reveals, manual replays and active time start with this release. {report.lessonAnalysis.catalogError ?? 'Current lesson catalog loaded completely.'}</p>
			<p class="notice">Phase three: {report.phaseThree.error ?? 'Assessment, attribution and change-log tables loaded completely. Optional checks are available from the learner home page. New source categories are captured after sign-in.'}</p>
			<div class="two-col"><section class="panel"><h3>Collection status</h3><dl><div><dt>Migration installed</dt><dd>{date(report.quality.installedAt)}</dd></div><div><dt>First version 2 event</dt><dd>{date(report.quality.firstEvent)}</dd></div><div><dt>Latest received event</dt><dd>{date(report.quality.latestReceived)}</dd></div><div><dt>Latest learner activity</dt><dd>{date(report.quality.latestEvent)}</dd></div><div><dt>Report snapshot</dt><dd>{date(report.snapshot)}</dd></div><div><dt>Cross-user queries</dt><dd>Complete · all pages fetched</dd></div></dl><p class="muted">Freshness includes test events. A quiet collection period can mean no activity or blocked tracking; it cannot establish either by itself.</p></section>
			<section class="panel"><h3>Coverage checks</h3><dl><div><dt>Version 2 events, all accounts</dt><dd>{report.quality.versionedEvents}</dd></div><div><dt>Included events in period</dt><dd>{report.quality.periodEvents}</dd></div><div><dt>Legacy / unsupported events</dt><dd>{report.quality.legacyCount}</dd></div><div><dt>Invalid events omitted</dt><dd>{report.quality.invalid}</dd></div><div><dt>Duplicate IDs omitted</dt><dd>{report.quality.duplicates}</dd></div><div><dt>Visits missing a start event</dt><dd>{report.quality.missingVisitStart}</dd></div><div><dt>New accounts without events</dt><dd>{report.quality.untrackedNewUsers}</dd></div><div><dt>Events received over 5 minutes late</dt><dd>{report.quality.lateEvents}</dd></div><div><dt>Events without a current account</dt><dd>{report.quality.unknownUsers}</dd></div></dl></section></div>
			<section class="panel"><h3>Test accounts and measurement rules</h3><p><b>{report.quality.excludedUsers}</b> administrator or marked test accounts. They are {report.includeTests ? 'included in this view' : 'excluded from the metrics'}.</p><p class="muted">To mark yourself or a friend, include test accounts, open Learner Journeys, select the learner, and use the test account button. Administrator accounts are excluded automatically.</p><ul class="rules"><li>A visit starts on a tracked action after 30 minutes without tracked activity. Refreshes and authentication token renewals do not count as new visits.</li><li>Learning activity requires an answer, spoken free turn, or exam completion. Opening a page or playing narration alone does not count.</li><li>A lesson attempt survives a reload and resume on this browser. Restarting via the day picker or advancing to another lesson creates a new attempt. Visits across devices remain separate.</li><li>Page hidden means the tab lost visibility. It does not prove the learner closed the app.</li><li>Retries reuse event IDs. Pending events are kept on this browser for up to 7 days, with a 500-event limit. Lost or blocked events cannot be recovered by the dashboard.</li><li>Analytics stores account IDs, event categories, lesson positions, and coarse browser information. It does not store raw audio, transcripts, answer text, or full URLs.</li></ul></section>
			<div class="notice">Historical events are kept separately. Reports cover signed-in practice, captured signup sources and optional comprehension checks. Anonymous conversion, speaking and writing gains, and causal effects of app changes are not established by these reports.</div>
		{/if}
		{#if report}<footer>Snapshot {date(report.snapshot)} · Dates in UTC · {report.includeTests ? 'Test accounts included' : 'Test accounts excluded'} · <button class="text-button" onclick={() => tab = 'quality'}>Measurement rules</button></footer>{/if}
	</div>
{/if}

<style>
	.insights { max-width: 1280px; margin: 0 auto; --ink: #f0f3ed; --muted: #a9b4b0; --line: #34443e; --accent: #b6dd94; color: var(--ink); font-family: 'IBM Plex Sans Variable', sans-serif; }
	.heading,.section-heading,.toolbar { display:flex; justify-content:space-between; align-items:center; gap:20px; }
	.heading { align-items:flex-start; margin-bottom:28px; }
	h1 { font-family:'Newsreader Variable',Georgia,serif; font-weight:500; font-size:clamp(2rem,3.4vw,3rem); letter-spacing:-.035em; line-height:1.1; margin:10px 0; }
	h2 { font-size:1.35rem; font-weight:500; margin:9px 0 12px; letter-spacing:-.02em; }
	h3 { font-size:1.05rem; margin:0 0 14px; font-weight:600; }
	p { line-height:1.6; margin:10px 0; font-size:.93rem; }
	.eyebrow { color:#b6dd94; font-size:.69rem; font-weight:600; letter-spacing:.13em; }
	.muted,small { color:#a9b4b0; }
	button,input,select { font:inherit; }
	button { cursor:pointer; min-height:42px; }
	button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible { outline:2px solid #b6dd94; outline-offset:4px; }
	.quiet { padding:8px 14px; border:1px solid #45544e; background:transparent; color:#e2e8e4; border-radius:7px; font-size:.82rem; }
	.quiet:hover { background:#283830; }
	.toolbar { padding:16px 0; border-block:1px solid var(--line); flex-wrap:wrap; }
	.filters { display:flex; align-items:center; gap:12px; flex-wrap:wrap; font-size:.82rem; }
	input,select { background:#1c2823; border:1px solid #45544e; color:#f0f3ed; border-radius:6px; padding:10px; min-width:0; }
	input[type=checkbox] { accent-color:#b6dd94; width:17px; height:17px; }
	.check { display:flex; align-items:center; gap:7px; }
	.status { color:#bdd5ae; display:flex; gap:8px; align-items:center; font-size:.73rem; }
	.status.waiting { color:#e0c385; }
	.dot { width:6px; height:6px; background:currentColor; border-radius:50%; }
	.tabs { display:flex; flex-wrap:wrap; gap:0 24px; border-bottom:1px solid var(--line); margin-bottom:26px; }
	.tabs button { border:0; border-bottom:2px solid transparent; border-radius:0; background:transparent; color:#a9b4b0; padding:20px 0 15px; white-space:nowrap; font-size:.88rem; }
	.tabs button.current { color:#b6dd94; border-bottom-color:#b6dd94; }
	.panel { background:#18231f; border:1px solid #34443e; border-radius:12px; padding:24px; }
	.metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:22px; }
	.metric { display:flex; flex-direction:column; gap:12px; padding:20px; }
	.metric>span { font-size:.8rem; color:#c2ccc6; }
	.metric strong { font-size:2.6rem; font-weight:400; line-height:1.2; font-variant-numeric:tabular-nums; }
	.metric em { font-size:1.2rem; color:#a9b4b0; font-style:normal; }
	.metric small { font-size:.72rem; line-height:1.5; }
	.overview-grid { display:grid; grid-template-columns:1.65fr 1fr; gap:22px; }
	.stack { display:flex; flex-direction:column; gap:22px; }
	.section-heading { margin-bottom:14px; }
	.section-heading p { margin-bottom:0; }
	.badge { display:inline-block; font-size:.69rem; line-height:1.6; padding:3px 9px; border:1px solid #45544e; border-radius:5px; color:#c4d3c8; white-space:nowrap; }
	.funnel { margin-top:28px; display:flex; flex-direction:column; gap:18px; }
	.funnel-label { display:flex; justify-content:space-between; gap:12px; margin-bottom:8px; font-size:.88rem; }
	.funnel-label small { display:inline-block; text-align:right; min-width:46px; font-size:.75rem; }
	.funnel-row>small { font-size:.7rem; }
	.track { height:7px; background:#2a3730; border-radius:3px; margin-bottom:5px; overflow:hidden; }
	.track>div { height:100%; background:#b6dd94; border-radius:3px; }
	.footnote { font-size:.77rem; color:#a9b4b0; margin-top:22px; line-height:1.6; }
	.big-number { font-size:2.7rem; color:#b6dd94; margin:22px 0 12px; line-height:1.2; }
	.notice { background:#2a3426; color:#d5dfc8; padding:15px 18px; border:1px solid #53633b; border-radius:8px; font-size:.85rem; line-height:1.7; margin:18px 0; }
	.notice.error { border-color:#a0564b; color:#ffc1b8; background:#382823; }
	.text-button { color:#b6dd94; background:none; border:0; padding:4px 0; font-size:.85rem; text-align:left; }
	.text-button:hover { text-decoration:underline; }
	.table-wrap { overflow:auto; padding:0; }
	table { border-collapse:collapse; width:100%; text-align:left; font-size:.82rem; }
	th { color:#a9b4b0; font-size:.7rem; font-weight:500; padding:16px 20px; white-space:nowrap; background:#1e2b24; }
	td { padding:12px 20px; border-top:1px solid #34443e; }
	td small { display:block; font-size:.69rem; margin-top:3px; white-space:nowrap; }
	tr.selected { background:#24332a; }
	.search { display:flex; flex-direction:column; gap:6px; font-size:.75rem; color:#a9b4b0; }
	.journey-detail { margin-top:24px; }
	.mono { font-family:monospace; font-size:.75rem; overflow-wrap:anywhere; }
	.visit { border-top:1px solid #34443e; padding:12px 0; }
	summary { display:flex; align-items:center; gap:15px; flex-wrap:wrap; cursor:pointer; font-size:.8rem; padding:8px 0; }
	summary::before { content:'+'; color:#b6dd94; }
	details[open]>summary::before { content:'−'; }
	.visit-meta { font-size:.75rem; }
	.timeline { list-style:none; padding:0 0 0 10px; margin:20px 0 0; }
	.timeline li { position:relative; border-left:1px solid #45544e; display:grid; grid-template-columns:140px 1fr; gap:20px; padding:0 0 22px 22px; }
	.timeline li::before { content:''; position:absolute; left:-4px; top:5px; width:7px; height:7px; border-radius:50%; background:#91b678; }
	.timeline li.problem::before { background:#ec9c80; }
	.timeline li.problem b { color:#ffc2a6; }
	time { color:#a9b4b0; font-size:.68rem; line-height:1.9; }
	.timeline b { display:block; font-size:.8rem; font-weight:500; }
	.timeline span { display:block; font-size:.7rem; color:#a9b4b0; margin-top:5px; }
	.two-col { display:grid; grid-template-columns:1fr 1fr; gap:22px; margin:22px 0; }
	dl { margin:0; } dl>div { display:flex; justify-content:space-between; gap:20px; padding:11px 0; border-bottom:1px solid #34443e; font-size:.8rem; }
	dt { color:#a9b4b0; } dd { margin:0; text-align:right; }
	.rules { padding-left:20px; color:#a9b4b0; font-size:.85rem; line-height:1.7; }
	.rules li { margin:12px 0; }
	footer { border-top:1px solid #34443e; margin-top:28px; padding:14px 0; color:#a9b4b0; font-size:.7rem; }
	footer button { font-size:.7rem; }
	.empty { max-width:750px; margin:40px auto; padding:36px; }
	.empty-cell { padding:34px; text-align:center; color:#a9b4b0; }
	code { overflow-wrap:anywhere; }
	.login-wrap { display:grid; place-items:center; min-height:70vh; }
	.login-card { display:flex; flex-direction:column; gap:14px; width:min(440px,100%); color:#f0f3ed; box-sizing:border-box; }
	.login-card h1 { font-size:2.2rem; }
	.login-card label { font-size:.85rem; }
	.primary { border:0; border-radius:6px; padding:12px; color:#152619; background:#b6dd94; font-weight:600; margin-top:12px; }
	@media(max-width:1100px) { .metrics { grid-template-columns:repeat(2,minmax(0,1fr)); } .overview-grid { grid-template-columns:1fr; } .stack { display:grid; grid-template-columns:1fr 1fr; } .two-col { grid-template-columns:1fr; } }
	@media(max-width:600px) { .heading { gap:10px; } .heading .quiet { padding:8px; white-space:nowrap; } .panel { padding:18px; } .table-wrap { padding:0; } .metrics { gap:10px; } .metric strong { font-size:2rem; } .metric { padding:15px; } .tabs { gap:22px; } .stack { display:flex; } .section-heading { flex-wrap:wrap; } .timeline li { grid-template-columns:1fr; gap:5px; } dl>div { gap:14px; } dd { max-width:50%; } .empty { padding:22px; } }
</style>
