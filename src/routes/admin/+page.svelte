<script lang="ts">
	/**
	 * Admin: the English app at a glance (src/lib/analytics/english-insights.ts). Five views:
	 * Overview (the funnel and day by day), Learners (one sortable, filterable table of every account,
	 * with its details and the account actions: test account, reset password, delete),
	 * Lessons (steps done, skipped, where lessons stop), AI cost, Audience (levels, reasons, sources).
	 */
	import type { PageData, ActionData } from './$types';
	import { tick } from 'svelte';
	import EnglishLessons from '$components/EnglishLessons.svelte';
	import '$components/insights-analysis.css';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let tab = $state('overview');
	$effect(() => { tab = data.tab; });
	const report = $derived(data.insights?.report ?? null);
	let search = $state('');
	let selectedId = $state('');
	/** The learners table: filters, then the chosen sort (most recently active first by default). */
	type Learner = NonNullable<typeof report>['learners'][number];
	const STAGES = ['Not onboarded', 'Not started', 'In a lesson', 'Between lessons', 'Caught up'];
	const stageOf = (l: Learner) => (l.status.startsWith('In Day') ? 'In a lesson' : l.status.startsWith('Next:') ? 'Between lessons' : l.status === 'Not finished a lesson' ? 'Not started' : l.status);
	let stage = $state(''), level = $state(''), activeOnly = $state(false);
	const COLUMNS: { key: keyof Learner; label: string }[] = [
		{ key: 'name', label: 'Learner' }, { key: 'status', label: 'Where they are' }, { key: 'level', label: 'Level' }, { key: 'reason', label: 'Reason' },
		{ key: 'signedUp', label: 'Signed up' }, { key: 'lastActive', label: 'Last visit' }, { key: 'visits', label: 'Visits' }, { key: 'daysActive', label: 'Days' },
		{ key: 'finished', label: 'Lessons' }, { key: 'streak', label: 'Streak' }, { key: 'cost', label: 'AI cost' }, { key: 'source', label: 'Source' }
	];
	let sortKey = $state<keyof Learner>('lastActive'), sortDir = $state<1 | -1>(-1);
	function sortBy(key: keyof Learner) {
		if (sortKey === key) sortDir = sortDir === 1 ? -1 : 1;
		else { sortKey = key; sortDir = typeof report?.learners[0]?.[key] === 'number' || ['signedUp', 'lastActive'].includes(key) ? -1 : 1; }
	}
	const value = (l: Learner, key: keyof Learner) => (key === 'name' ? (l.name || l.email).toLowerCase() : l[key]);
	const learners = $derived((report?.learners ?? [])
		.filter(l => `${l.name} ${l.email}`.toLowerCase().includes(search.trim().toLowerCase()))
		.filter(l => !stage || stageOf(l) === stage)
		.filter(l => !level || (level === 'none' ? !l.level : l.level === level))
		.filter(l => !activeOnly || (report && Date.parse(l.lastActive) >= Date.parse(report.now) - report.days * 86_400_000))
		.sort((a, b) => {
			const x = value(a, sortKey), y = value(b, sortKey);
			if (x === y) return 0;
			if (x === null || x === undefined || x === '') return 1;
			if (y === null || y === undefined || y === '') return -1;
			return (x > y ? 1 : -1) * sortDir;
		}));
	const selected = $derived(report?.learners.find(l => l.id === selectedId) ?? null);
	const TABS = [{ id: 'overview', name: 'Overview' }, { id: 'learners', name: 'Learners' }, { id: 'lessons', name: 'Lessons' }, { id: 'cost', name: 'AI cost' }, { id: 'audience', name: 'Audience' }];

	const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : '–');
	const money = (n: number) => `$${n < 10 ? n.toFixed(2) : Math.round(n)}`;
	const when = (iso: string | null) => {
		if (!iso) return '–';
		const days = Math.floor((Date.parse(report?.now ?? new Date().toISOString()) - Date.parse(iso)) / 86_400_000);
		const date = new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
		return days <= 0 ? `Today` : days === 1 ? `Yesterday` : days < 7 ? `${days} days ago` : date;
	};
	const stamp = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
	const MODULES: Record<string, string> = { 'listen-act': 'Listen and connect', 'listen-retell': 'Listen and retell', phrases: 'Natural phrases', traps: 'Persian-speaker traps', 'say-in-english': 'Say it in English', 'voice-messages': 'Voice messages', 'say-it-better': 'Tell your story', 'choose-persuade': 'Choose and persuade', scenario: 'Role-play' };
	function eventLabel(e: { name: string; day: number | null; track: unknown; module: unknown; outcome: unknown; done: unknown; skipped: unknown }) {
		const version = e.track === 'professional' ? 'Professional' : 'Intermediate';
		if (e.name === 'visit_started') return 'Opened the app';
		if (e.name === 'lesson_started') return `Started Day ${e.day} (${version})`;
		if (e.name === 'lesson_completed') return `Finished Day ${e.day} · ${e.done} done, ${e.skipped} skipped`;
		if (e.name === 'lesson_progress') return `${MODULES[String(e.module)] ?? e.module}: ${e.outcome === 'skipped' ? 'skipped' : 'done'}`;
		return e.name;
	}
	async function open(id: string) {
		selectedId = id;
		await tick();
		document.querySelector('.learner-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
	/** Bar heights for a one-series chart (0 stays a hairline so the day is still visible). */
	const bars = (values: number[]) => { const max = Math.max(1, ...values); return values.map(v => Math.max(v ? 6 : 1, Math.round((v / max) * 100))); };
	const top = $derived(report ? [...report.learners].filter(l => l.cost > 0).sort((a, b) => b.cost - a.cost).slice(0, 8) : []);
	const funnelTop = $derived(report?.funnel[0]?.count ?? 0);
</script>

<svelte:head><title>Admin · Mirifer English</title></svelte:head>

{#if !data.authorized}
	<div class="login-wrap">
		<form method="POST" action="?/login" class="panel login-card">
			<span class="eyebrow">MIRIFER ADMIN</span>
			<h1>Sign in</h1>
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
		<header class="heading">
			<div><span class="eyebrow">MIRIFER · ENGLISH</span><h1>How is the app doing?</h1></div>
			<form method="POST" action="?/logout"><button class="quiet">Sign out</button></form>
		</header>
		<form method="GET" class="filters">
			<input type="hidden" name="tab" value={tab} />
			<select aria-label="Period" name="days" value={String(report?.days ?? 30)} onchange={e => (e.currentTarget.form as HTMLFormElement).requestSubmit()}>
				<option value="7">Last 7 days</option><option value="14">Last 14 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
			</select>
			<label class="check"><input type="checkbox" name="tests" value="1" checked={report?.includeTests ?? false} onchange={e => (e.currentTarget.form as HTMLFormElement).requestSubmit()} /> Include test accounts</label>
		</form>
		<nav class="tabs" aria-label="Admin views">{#each TABS as item}<button class:current={tab === item.id} aria-pressed={tab === item.id} onclick={() => (tab = item.id)}>{item.name}</button>{/each}</nav>
		{#if form && 'error' in form}<p class="notice error" role="alert">{form.error}</p>{/if}
		{#if form && 'success' in form}<p class="notice" role="status">{form.success}</p>{/if}

		{#if !report}
			<section class="panel"><h2>The report isn’t available</h2><p class="muted">{data.insights?.reason}</p></section>

		{:else if tab === 'overview'}
			<div class="metrics">
				<article class="panel metric"><span>New sign-ups</span><strong>{report.totals.signups}</strong></article>
				<article class="panel metric"><span>Active learners</span><strong>{report.totals.active}</strong><small>Opened the app in the period</small></article>
				<article class="panel metric"><span>Lessons finished</span><strong>{report.totals.lessonsFinished}<em> / {report.totals.lessonsStarted}</em></strong><small>{pct(report.totals.lessonsFinished, report.totals.lessonsStarted)} of lessons started</small></article>
				<article class="panel metric"><span>Came back next day</span><strong>{pct(report.totals.nextDay.returned, report.totals.nextDay.eligible)}</strong><small>{report.totals.nextDay.returned} of {report.totals.nextDay.eligible} after their first lesson</small></article>
			</div>

			<section class="panel">
				<h2>Where people drop off</h2>
				<p class="muted">Accounts created in the last {report.days} days, and how far each got.</p>
				<ol class="funnel">
					{#each report.funnel as stage, i}
						<li>
							<div class="funnel-row"><span>{stage.label}</span><b>{stage.count}</b><small>{i ? pct(stage.count, funnelTop) : ''}</small></div>
							<div class="track"><div class="fill" style="width:{funnelTop ? Math.max(stage.count ? 2 : 0, (stage.count / funnelTop) * 100) : 0}%"></div></div>
						</li>
					{/each}
				</ol>
			</section>

			<div class="two">
				<section class="panel">
					<h2>Active learners per day</h2>
					<div class="chart" role="img" aria-label="Active learners per day">
						{#each bars(report.series.map(s => s.active)) as h, i}<span class="bar" style="height:{h}%" title="{report.series[i].date}: {report.series[i].active} active"></span>{/each}
					</div>
					<p class="axis"><span>{report.series[0]?.date}</span><span>Today</span></p>
				</section>
				<section class="panel">
					<h2>Lessons finished per day</h2>
					<div class="chart" role="img" aria-label="Lessons finished per day">
						{#each bars(report.series.map(s => s.finished)) as h, i}<span class="bar" style="height:{h}%" title="{report.series[i].date}: {report.series[i].finished} finished, {report.series[i].started} started"></span>{/each}
					</div>
					<p class="axis"><span>{report.series[0]?.date}</span><span>Today</span></p>
				</section>
			</div>

		{:else if tab === 'learners'}
			<div class="table-filters">
				<input type="search" placeholder="Search name or email" aria-label="Search learners" bind:value={search} />
				<select aria-label="Where they are" bind:value={stage}>
					<option value="">Anywhere in the course</option>
					{#each STAGES as s}<option value={s}>{s}</option>{/each}
				</select>
				<select aria-label="Level" bind:value={level}>
					<option value="">Any level</option><option>Intermediate</option><option>Professional</option><option value="none">No level yet</option>
				</select>
				<label class="check"><input type="checkbox" bind:checked={activeOnly} /> Active in the last {report.days} days</label>
			</div>
			<p class="muted">{learners.length} of {report.learners.length} accounts. Tap a column to sort, a row to see the details and account actions. A visit is each time the app is opened after 30 minutes away, signed in again or not.</p>
			<div class="table-wrap learners-table">
				<table>
					<thead><tr>
						{#each COLUMNS as col}
							<th aria-sort={sortKey === col.key ? (sortDir === 1 ? 'ascending' : 'descending') : undefined}>
								<button class="sort" onclick={() => sortBy(col.key)}>{col.label}{#if sortKey === col.key}<span aria-hidden="true">{sortDir === 1 ? ' ▲' : ' ▼'}</span>{/if}</button>
							</th>
						{/each}
					</tr></thead>
					<tbody>
						{#each learners as l (l.id)}
							<tr class:current={selectedId === l.id} onclick={() => open(l.id)}>
								<td class="who"><button class="row-link" onclick={e => { e.stopPropagation(); void open(l.id); }}><b>{l.name || l.email}</b></button>{#if l.test}<em class="tag">{l.admin ? 'admin' : 'test'}</em>{/if}<small>{l.name ? l.email : ''}</small></td>
								<td class="wrap">{l.status}</td>
								<td>{l.level ?? '–'}</td>
								<td class="wrap">{l.reason ?? '–'}</td>
								<td>{when(l.signedUp)}</td>
								<td>{when(l.lastVisit ?? l.lastSignIn)}</td>
								<td class="num">{l.visits}</td>
								<td class="num">{l.daysActive}</td>
								<td class="num">{l.finished}</td>
								<td class="num">{l.streak}</td>
								<td class="num">{l.cost ? money(l.cost) : '–'}</td>
								<td>{l.source ?? '–'}</td>
							</tr>
						{:else}<tr><td colspan={COLUMNS.length} class="muted">No accounts match.</td></tr>{/each}
					</tbody>
				</table>
			</div>
			{#if selected}
				<section class="panel learner-detail">
					<span class="eyebrow">LEARNER</span>
					<h2>{selected.name || selected.email}</h2>
					<p class="muted">{selected.email}</p>
					<dl class="details">
						<div><dt>Status</dt><dd>{selected.status}</dd></div>
						<div><dt>Signed up</dt><dd>{stamp(selected.signedUp)}</dd></div>
						<div><dt>Visits (all time)</dt><dd>{selected.visits} · {selected.visitsInPeriod} in the period</dd></div>
						<div><dt>Days with a visit</dt><dd>{selected.daysActive}</dd></div>
						<div><dt>Last visit</dt><dd>{selected.lastVisit ? stamp(selected.lastVisit) : '–'}</dd></div>
						<div><dt>Last sign-in</dt><dd>{selected.lastSignIn ? stamp(selected.lastSignIn) : '–'}</dd></div>
						<div><dt>Level · reason</dt><dd>{selected.level ?? '–'} · {selected.reason ?? '–'}</dd></div>
						<div><dt>Lessons finished</dt><dd>{selected.finished}{selected.lastLesson ? ` · last on ${selected.lastLesson}` : ''}</dd></div>
						<div><dt>Streak</dt><dd>{selected.streak} days</dd></div>
						<div><dt>AI use (period)</dt><dd>{selected.minutes} min speech · {selected.aiRequests} AI requests · about {money(selected.cost)}</dd></div>
						<div><dt>Came from</dt><dd>{selected.source ?? '–'}</dd></div>
					</dl>
					<h3>Recent activity</h3>
					<ol class="timeline">
						{#each selected.timeline as e}<li><time>{stamp(e.at)}</time><span>{eventLabel(e)}</span></li>{:else}<li class="muted">Nothing recorded yet.</li>{/each}
					</ol>

					<h3>Account</h3>
					<div class="account-actions">
						{#if !selected.admin}
							<form method="POST" action="?/exclude&tab=learners">
								<input type="hidden" name="user_id" value={selected.id} />
								<input type="hidden" name="exclude" value={selected.test ? '0' : '1'} />
								<button class="quiet">{selected.test ? 'Count this account again' : 'Mark as a test account'}</button>
							</form>
						{/if}
						<details>
							<summary>Reset password</summary>
							<form method="POST" action="?/setPassword&tab=learners" class="stack-form">
								<input type="hidden" name="userId" value={selected.id} />
								<label>New password <input name="password" type="password" minlength="6" required autocomplete="new-password" /></label>
								<label>Type it again <input name="confirm" type="password" minlength="6" required autocomplete="new-password" /></label>
								<button class="quiet">Set the new password</button>
								<small>The learner isn’t told: let them know yourself.</small>
							</form>
						</details>
						{#if !selected.admin && selected.id !== data.selfId}
							<details>
								<summary>Delete account</summary>
								<form method="POST" action="?/deleteUser&tab=learners" class="stack-form" onsubmit={e => { if (!confirm(`Delete ${selected.email} and all of their data? This can’t be undone.`)) e.preventDefault(); }}>
									<input type="hidden" name="userId" value={selected.id} />
									<label>Type <b>{selected.email}</b> to confirm <input name="confirmEmail" type="email" required autocomplete="off" /></label>
									<button class="danger">Delete forever</button>
								</form>
							</details>
						{/if}
					</div>
				</section>
			{/if}

		{:else if tab === 'lessons'}
			<EnglishLessons report={report.lessons} />

		{:else if tab === 'cost'}
			<div class="metrics">
				<article class="panel metric"><span>Estimated cost</span><strong>{money(report.totals.cost)}</strong><small>Last {report.days} days</small></article>
				<article class="panel metric"><span>Speech turned into text</span><strong>{report.totals.minutes}<em> min</em></strong><small>About ${(0.006).toFixed(3)} a minute</small></article>
				<article class="panel metric"><span>AI feedback requests</span><strong>{report.totals.aiRequests}</strong><small>About $0.002 each</small></article>
				<article class="panel metric"><span>Per lesson finished</span><strong>{report.totals.lessonsFinished ? money(report.totals.cost / report.totals.lessonsFinished) : '–'}</strong></article>
			</div>
			<section class="panel">
				<h2>Cost per day</h2>
				<div class="chart" role="img" aria-label="Estimated AI cost per day">
					{#each bars(report.series.map(s => s.cost)) as h, i}<span class="bar" style="height:{h}%" title="{report.series[i].date}: {money(report.series[i].cost)} · {report.series[i].minutes} min · {report.series[i].aiRequests} requests"></span>{/each}
				</div>
				<p class="axis"><span>{report.series[0]?.date}</span><span>Today</span></p>
			</section>
			<section class="panel">
				<h2>Who uses the most</h2>
				<div class="table-wrap"><table>
					<thead><tr><th>Learner</th><th>Speech</th><th>AI requests</th><th>Cost</th></tr></thead>
					<tbody>{#each top as l}<tr><td>{l.name || l.email}</td><td>{l.minutes} min</td><td>{l.aiRequests}</td><td>{money(l.cost)}</td></tr>{:else}<tr><td colspan="4" class="muted">No AI use in this period.</td></tr>{/each}</tbody>
				</table></div>
				<p class="muted">Reached a daily limit: {report.limitHits.length ? report.limitHits.map(h => `${report.learners.find(l => l.id === h.id)?.email ?? h.id} on ${h.date}`).join(', ') : 'nobody'}. Prices are estimates; check the providers’ bills for exact amounts.</p>
			</section>

		{:else if tab === 'audience'}
			<div class="two">
				{#each [{ title: 'Level', rows: report.audience.levels }, { title: 'Why they learn', rows: report.audience.reasons }, { title: `Where new sign-ups came from (last ${report.days} days)`, rows: report.sources }] as group}
					<section class="panel">
						<h2>{group.title}</h2>
						{#if group.rows.length}
							{@const total = group.rows.reduce((s, r) => s + r.count, 0)}
							<ul class="split">{#each group.rows as row}<li><span>{row.label}</span><b>{row.count}</b><small>{pct(row.count, total)}</small><div class="track"><div class="fill" style="width:{(row.count / total) * 100}%"></div></div></li>{/each}</ul>
						{:else}<p class="muted">No answers yet.</p>{/if}
					</section>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.insights { max-width: 1440px; margin: 0 auto; color: #f0f3ed; }
	.heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
	h1 { font-family: 'Newsreader Variable', Georgia, serif; font-weight: 500; font-size: clamp(1.8rem, 4vw, 2.6rem); line-height: 1.1; margin: 8px 0 18px; }
	h2 { font-size: 1.15rem; font-weight: 600; margin: 0 0 10px; }
	h3 { font-size: 1rem; margin: 20px 0 10px; }
	p { line-height: 1.55; margin: 8px 0; font-size: .92rem; }
	.eyebrow { color: #b6dd94; font-size: .7rem; font-weight: 600; letter-spacing: .13em; }
	.muted, small { color: #a9b4b0; }
	button, input, select { font: inherit; }
	button { cursor: pointer; min-height: 44px; }
	button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid #b6dd94; outline-offset: 3px; }
	.quiet { padding: 8px 14px; border: 1px solid #45544e; background: transparent; color: #e2e8e4; border-radius: 8px; font-size: .85rem; }
	.quiet:hover { background: #283830; }
	.filters { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: .88rem; padding-bottom: 6px; }
	input, select { background: #1c2823; border: 1px solid #45544e; color: #f0f3ed; border-radius: 8px; padding: 10px; min-height: 44px; }
	input[type=checkbox] { accent-color: #b6dd94; width: 18px; height: 18px; min-height: 0; }
	.check { display: flex; align-items: center; gap: 8px; }
	.tabs { display: flex; gap: 22px; border-bottom: 1px solid #34443e; margin: 8px 0 22px; overflow-x: auto; scrollbar-width: none; }
	.tabs button { border: 0; border-bottom: 2px solid transparent; background: transparent; color: #a9b4b0; padding: 14px 0 12px; white-space: nowrap; font-size: .92rem; }
	.tabs button.current { color: #b6dd94; border-bottom-color: #b6dd94; }
	.panel { background: #18231f; border: 1px solid #34443e; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
	.metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
	.metric { display: flex; flex-direction: column; gap: 6px; margin: 0 0 4px; }
	.metric > span { font-size: .82rem; color: #c2ccc6; }
	.metric strong { font-size: 2.1rem; font-weight: 400; line-height: 1.15; font-variant-numeric: tabular-nums; }
	.metric em { font-size: 1.1rem; color: #a9b4b0; font-style: normal; }
	.metric small { font-size: .75rem; }
	.two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
	.two .panel { margin-bottom: 0; }
	.metrics + .panel { margin-top: 16px; }
	.funnel, .split { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 14px; }
	.funnel-row, .split li { display: grid; grid-template-columns: 1fr auto 3.2em; gap: 10px; align-items: baseline; font-size: .92rem; }
	.funnel-row b, .split b { font-variant-numeric: tabular-nums; font-size: 1.05rem; }
	.funnel-row small, .split small { text-align: right; }
	.split li .track { grid-column: 1 / -1; }
	.track { height: 10px; background: #24322c; border-radius: 4px; margin-top: 6px; overflow: hidden; }
	.fill { height: 100%; background: #b6dd94; border-radius: 4px; }
	.chart { display: flex; align-items: flex-end; gap: 2px; height: 140px; margin-top: 14px; border-bottom: 1px solid #34443e; }
	.bar { flex: 1; background: #b6dd94; border-radius: 4px 4px 0 0; min-width: 2px; }
	.bar:hover { background: #d9f0c4; }
	.axis { display: flex; justify-content: space-between; font-size: .75rem; color: #a9b4b0; margin: 6px 0 0; }
	.table-filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
	.table-filters input[type=search] { flex: 1 1 220px; }
	.learners-table { border: 1px solid #34443e; border-radius: 12px; margin: 10px 0 16px; }
	.learners-table th { padding: 0; white-space: nowrap; background: #1e2b24; position: sticky; top: 0; }
	.learners-table table { font-size: .85rem; }
	.learners-table td { white-space: nowrap; vertical-align: top; padding: 9px 7px; }
	/* Longer text wraps instead of widening the table. */
	.learners-table td.wrap { white-space: normal; min-width: 7.5em; max-width: 11em; }
	.learners-table .who small { max-width: 15em; overflow: hidden; text-overflow: ellipsis; }
	.learners-table th:first-child, .learners-table td:first-child { position: sticky; left: 0; background: #18231f; z-index: 1; }
	.learners-table th:first-child { background: #1e2b24; z-index: 2; }
	.learners-table tbody tr { cursor: pointer; }
	.learners-table tbody tr:hover td, .learners-table tr.current td { background: #22312a; }
	.learners-table .num { text-align: right; font-variant-numeric: tabular-nums; }
	.learners-table .who small { display: block; }
	.sort { width: 100%; min-height: 44px; padding: 10px 7px; border: 0; background: transparent; color: #a9b4b0; font-size: .82rem; font-weight: 500; text-align: left; }
	.sort:hover { color: #f0f3ed; }
	.row-link { min-height: 0; padding: 0; border: 0; background: none; color: inherit; text-align: left; }
	.account-actions { display: grid; gap: 12px; justify-items: start; }
	.account-actions details { width: 100%; max-width: 420px; }
	.account-actions summary { cursor: pointer; color: #b6dd94; min-height: 44px; display: flex; align-items: center; }
	.stack-form { display: grid; gap: 10px; margin-top: 6px; }
	.stack-form label { display: grid; gap: 6px; font-size: .88rem; }
	.danger { background: #8f2f2f; color: #fff; border: 0; border-radius: 8px; padding: 8px 14px; }
	.tag { font-style: normal; font-size: .72rem; color: #101b16; background: #e0c385; border-radius: 999px; padding: 1px 8px; }
	.details { display: grid; gap: 8px; margin: 14px 0; }
	.details div { display: grid; grid-template-columns: 11em 1fr; gap: 12px; font-size: .9rem; }
	.details dt { color: #a9b4b0; }
	.details dd { margin: 0; }
	.timeline { list-style: none; margin: 0 0 16px; padding: 0; display: grid; gap: 6px; font-size: .88rem; }
	.timeline li { display: grid; grid-template-columns: 11em 1fr; gap: 12px; }
	.timeline time { color: #a9b4b0; font-variant-numeric: tabular-nums; }
	.table-wrap { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: .9rem; }
	th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #2a3832; }
	th { color: #a9b4b0; font-weight: 500; }
	.notice { padding: 12px 14px; border-radius: 8px; background: #22352b; }
	.notice.error { background: #3a2222; }
	.login-wrap { display: grid; place-items: center; min-height: 70vh; }
	.login-card { display: grid; gap: 10px; width: min(380px, 100%); }
	.primary { background: #b6dd94; color: #101b16; border: 0; border-radius: 8px; font-weight: 600; margin-top: 8px; }
	@media (max-width: 760px) {
		.metrics { grid-template-columns: 1fr 1fr; }
		.two { grid-template-columns: 1fr; }
		.details div, .timeline li { grid-template-columns: 1fr; gap: 2px; }
	}
</style>
