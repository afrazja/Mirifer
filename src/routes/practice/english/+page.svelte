<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import CourseSwitcher from '$lib/components/CourseSwitcher.svelte';
	import PracticeVoice from '$lib/components/PracticeVoice.svelte';
	import EnglishSpeechInput from '$lib/components/EnglishSpeechInput.svelte';
	import { GOALS, GOAL_IDS, HOTEL_ID, MAX_REPLY, MAX_TURNS, learnerTurns, startHotel, wordCount, type Correction, type DisplayText, type GoalId, type HotelState, type Variant } from '$lib/practice/hotel';
	import { getLanguage, setLanguage, loadPracticeDraft, savePracticeDraft, clearPracticeDraft } from '$services/data-layer';
	import { trackEvent } from '$services/analytics';
	import { playAudioPromise, playAudioUrl, stopAllAudio, ENGLISH_VOICES, type TTSVoice } from '$services/tts';

	let { data, form }: PageProps = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const text = (value: DisplayText) => value[language];
	let scene = $state<HotelState>(startHotel());
	let started = $state(false), ready = $state(false), saving = $state(false), saved = $state(false), checking = $state(false);
	let draft = $state(''), pending = $state(''), feedback = $state<DisplayText | null>(null);
	let latestCorrection = $state<Correction | null>(null);
	/** End-of-conversation review: the learner's own sentences, said more naturally. */
	type Upgrade = { original: string; better: string; why: DisplayText };
	let upgrades = $state<Upgrade[]>([]);
	let review = $state<'idle' | 'loading' | 'ready' | 'failed' | 'limit'>('idle');
	/** Signatures that let /api/english/voice speak Jamie's AI-written lines. */
	let voiceSigs = $state<Record<string, string>>({});
	let voiceAvailable = $state(false), voiceOn = $state(true), voiceMessage = $state('');
	// Jamie's voice changes from one run to the next (two men, two women), so a
	// replay does not sound identical.
	let jamieVoice = $state<TTSVoice>('b');
	const pickJamieVoice = () => (jamieVoice = ENGLISH_VOICES[Math.floor(Math.random() * ENGLISH_VOICES.length)].id);
	let generation = 0;
	let input: HTMLTextAreaElement | undefined = $state();
	let conversation: HTMLDivElement | undefined = $state();
	let saveForm: HTMLFormElement | undefined = $state();
	const complete = $derived(scene.done);
	const replies = $derived(learnerTurns(scene));
	const averageWords = $derived(replies.length ? Math.round(replies.reduce((sum, reply) => sum + wordCount(reply), 0) / replies.length * 10) / 10 : 0);
	const outOfTurns = $derived(!complete && replies.length >= MAX_TURNS);
	const payload = $derived(JSON.stringify({ variant: scene.variant, goals: scene.goals, proof: scene.proof, turns: Math.max(1, replies.length), averageWords }));

	function stopReceptionVoice() { stopAllAudio(); }
	/**
	 * Jamie is voiced expressively by OpenAI through /api/english/voice: the
	 * greeting and fallback lines are prepared, and his AI-written lines carry
	 * a server signature. If that fails, the free Microsoft voice through
	 * /proxy/tts takes over.
	 */
	async function speakReception(line: string) {
		if (!voiceAvailable || !line) return;
		stopReceptionVoice(); voiceMessage = '';
		const voice = jamieVoice;
		const sig = voiceSigs[line];
		const url = `/api/english/voice?v=1&voice=${voice}&text=${encodeURIComponent(line)}${sig ? `&sig=${encodeURIComponent(sig)}` : ''}`;
		if (!(await playAudioUrl(url))) void playAudioPromise(line, 1, 'en-US', undefined, voice);
	}
	function toggleReceptionVoice() {
		voiceOn = !voiceOn;
		if (!voiceOn) stopReceptionVoice();
		else {
			const last = [...scene.turns].reverse().find(turn => turn.speaker === 'reception');
			if (last) speakReception(last.text);
		}
	}

	function event(name: Parameters<typeof trackEvent>[0], metadata: Record<string, string | number | boolean> = {}) {
		void trackEvent(name, { metadata: { mode: 'conversation', course: 'en', scenario: HOTEL_ID, ...metadata } });
	}
	function remember() {
		savePracticeDraft(data.learnerId, { variant: scene.variant, turns: scene.turns, goals: scene.goals, proof: scene.proof, corrections: scene.corrections, voice: voiceSigs, done: scene.done, upgrades: review === 'ready' ? upgrades : undefined });
	}
	onMount(() => {
		voiceAvailable = true;
		pickJamieVoice();
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		const previous = loadPracticeDraft(data.learnerId);
		if (previous) {
			scene = { variant: previous.variant, turns: previous.turns, goals: previous.goals as GoalId[], proof: previous.proof, corrections: previous.corrections, done: previous.done ?? false };
			voiceSigs = previous.voice ?? {}; started = true;
			if (previous.upgrades) { upgrades = previous.upgrades; review = 'ready'; }
			else if (scene.done) void loadReview();
		}
		ready = true;
		return () => { stopReceptionVoice(); };
	});
	async function changeDisplay(value: 'en' | 'fa') { language = value; await setLanguage(value); }
	async function start(variant: Variant = 'lift') {
		generation++; checking = false; pending = ''; stopReceptionVoice(); pickJamieVoice(); scene = startHotel(variant); voiceSigs = {}; upgrades = []; review = 'idle'; feedback = null; latestCorrection = null; draft = ''; voiceMessage = '';
		form = null; saved = false; started = true; remember();
		event('conversation_started', { replay: !!data.completed });
		await tick(); input?.focus();
		if (voiceOn) speakReception(scene.turns[0].text);
	}
	const failure: Record<'limit' | 'unavailable' | 'signin', DisplayText> = {
		limit: { en: 'Today’s AI conversation turns are used up. The limit resets at 00:00 UTC.', fa: 'سهمیهٔ امروز گفت‌وگو با هوش مصنوعی تمام شده است. سهمیه ساعت ۰۰:۰۰ به وقت UTC تازه می‌شود.' },
		unavailable: { en: 'Jamie can’t answer right now. Your reply is still in the box. Try sending it again in a moment.', fa: 'جیمی الان نمی‌تواند جواب بدهد. پاسخت هنوز در کادر است؛ کمی بعد دوباره بفرست.' },
		signin: { en: 'Your session has ended. Sign in again to continue.', fa: 'نشست تو تمام شده است. برای ادامه دوباره وارد شو.' }
	};
	async function send() {
		const reply = draft.trim();
		if (complete || checking || outOfTurns || !reply) return;
		if (reply.length > MAX_REPLY) { feedback = { en: `Keep each reply under ${MAX_REPLY} characters.`, fa: `هر پاسخ باید کمتر از ${MAX_REPLY} نویسه باشد.` }; return; }
		feedback = null; latestCorrection = null;
		const turns = [...scene.turns, { speaker: 'learner' as const, text: reply }];
		const current = generation;
		checking = true; pending = reply;
		await tick();
		if (conversation) conversation.scrollTop = conversation.scrollHeight;
		try {
			const response = await fetch('/api/english/converse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ variant: scene.variant, turns, goals: scene.goals, proof: scene.proof }) });
			if (current !== generation) return;
			if (!response.ok) { feedback = failure[response.status === 429 ? 'limit' : response.status === 401 ? 'signin' : 'unavailable']; return; }
			const result = await response.json();
			if (current !== generation) return;
			if (typeof result.reply !== 'string' || !Array.isArray(result.goals)) { feedback = failure.unavailable; return; }
			const fix = result.correction;
			const correction: Correction | null = fix && typeof fix.improved === 'string' && typeof fix.note?.en === 'string' && typeof fix.note?.fa === 'string'
				? { original: reply, improved: fix.improved, note: { en: fix.note.en, fa: fix.note.fa } } : null;
			scene = {
				...scene, turns: [...turns, { speaker: 'reception', text: result.reply }],
				goals: GOAL_IDS.filter(id => result.goals.includes(id)), proof: typeof result.proof === 'string' ? result.proof : null,
				done: result.done === true, corrections: correction ? [...scene.corrections, correction] : scene.corrections
			};
			if (typeof result.voiceSig === 'string') voiceSigs = { ...voiceSigs, [result.reply]: result.voiceSig };
			latestCorrection = correction; draft = ''; remember();
			event('answer_submitted', { index: replies.length, count: wordCount(reply), correct: !correction });
			await tick();
			if (conversation) conversation.scrollTop = conversation.scrollHeight;
			if (voiceOn) speakReception(result.reply);
			if (complete) { event('conversation_completed', { count: replies.length }); saveForm?.requestSubmit(); void loadReview(); }
			else input?.focus();
		} catch {
			if (current === generation) feedback = failure.unavailable;
		} finally {
			if (current === generation) { checking = false; pending = ''; }
		}
	}
	async function loadReview() {
		if (review === 'loading' || !scene.done || !scene.proof) return;
		const current = generation;
		review = 'loading';
		try {
			const response = await fetch('/api/english/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ variant: scene.variant, turns: scene.turns, goals: scene.goals, proof: scene.proof }) });
			if (current !== generation) return;
			if (!response.ok) { review = response.status === 429 ? 'limit' : 'failed'; return; }
			const result = await response.json();
			if (current !== generation) return;
			const items: unknown[] = Array.isArray(result.upgrades) ? result.upgrades : [];
			const valid = items.filter((item): item is Upgrade & { voiceSig?: unknown } => {
				const value = item as Record<string, any>;
				return typeof value?.original === 'string' && typeof value.better === 'string' && typeof value.why?.en === 'string' && typeof value.why?.fa === 'string';
			});
			const sigs = { ...voiceSigs };
			for (const item of valid) if (typeof item.voiceSig === 'string') sigs[item.better] = item.voiceSig;
			voiceSigs = sigs;
			upgrades = valid.map(({ original, better, why }) => ({ original, better, why }));
			review = 'ready';
			if (!saved) remember();
		} catch {
			if (current === generation) review = 'failed';
		}
	}
	function returnToIntro() {
		generation++; checking = false; pending = ''; stopReceptionVoice(); clearPracticeDraft(data.learnerId); started = false; feedback = null; latestCorrection = null; draft = ''; form = null;
	}
</script>

<svelte:head>
	<title>{isFa ? 'یک اتاق آرام‌تر | تمرین انگلیسی' : 'A quieter room | English practice'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="practice-page" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/languages" backLabel={isFa ? 'زبان‌ها' : 'Languages'} direction={isFa ? 'rtl' : 'ltr'}>
		{#snippet actions()}
			<label class="display-control">{isFa ? 'نمایش' : 'Display'}
				<select aria-label={isFa ? 'زبان نمایش' : 'Display language'} value={language} onchange={e => void changeDisplay(e.currentTarget.value as 'en' | 'fa')}>
					<option value="en">English</option><option value="fa">فارسی</option>
				</select>
			</label>
		{/snippet}
	</AppHeader>
	<CourseSwitcher {language} targetLanguage="en" />

	{#if !started}
		<section class="welcome" aria-labelledby="lesson-title">
			<div class="welcome-copy">
				<p class="eyebrow">{isFa ? 'انگلیسی · درس ۰۱ · آزمایشی' : 'ENGLISH · LESSON 01 · PILOT'}</p>
				<h1 id="lesson-title">{isFa ? 'یک اتاق آرام‌تر، لطفاً.' : 'A quieter room, please.'}</h1>
				<p class="lead">{isFa ? 'ساعت ۱۰ شب است و اتاقت پر از سروصداست. به پذیرش برو و با جیمی حرف بزن.' : 'It’s 10 pm and your room is too noisy. Go down to reception and talk it through with Jamie.'}</p>
				<div class="tags"><span>{isFa ? 'حدود ۵ تا ۱۰ دقیقه' : 'About 5–10 minutes'}</span><span>{isFa ? 'مکالمهٔ آزاد' : 'Free conversation'}</span></div>
				<p class="instructions">{isFa ? 'متن آماده‌ای در کار نیست و جواب درست یا غلط هم وجود ندارد. با کلمات خودت حرف بزن و خودت تصمیم بگیر. سعی کن با جمله‌های کامل جواب بدهی؛ جیمی سؤال‌های بیشتری از تو می‌پرسد.' : 'There’s no script and no right answer. Say things in your own words and make your own decisions. Try to answer in full sentences: Jamie will ask you follow-up questions.'}</p>
				{#if data.completed || saved}<p class="completed-label">✓ {isFa ? 'این درس را قبلاً تمام کرده‌ای. دوباره تمرین کن.' : 'You’ve completed this lesson. You can practise again.'}</p>{/if}
				<button class="primary start" disabled={!ready} onclick={() => start(data.completed?.variant === 'lift' ? 'street' : 'lift')}>{data.completed || saved ? (isFa ? 'تمرین دوباره' : 'Practise again') : (isFa ? 'شروع گفت‌وگو' : 'Start the conversation')} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
			</div>
			<aside class="briefing" aria-label={isFa ? 'اطلاعات مأموریت' : 'Your mission brief'}>
				<div class="hotel-art" aria-hidden="true"><div class="moon"></div><div class="hotel"><span>WILLOW</span><div class="windows">▦ ▦ ▦<br />▦ ▦ ▦<br />▦ ▦ ▦</div><div class="door"></div></div></div>
				<div class="brief-body"><p class="eyebrow">{isFa ? 'مأموریت تو' : 'YOUR MISSION'}</p><h2>{isFa ? 'برای امشب یک راه‌حل پیدا کن' : 'Sort out tonight, your way.'}</h2>
					<ol>{#each GOALS as goal}<li>{text(goal.label)}</li>{/each}</ol>
					<div class="key-card"><span>WILLOW HOTEL<br /><small>{isFa ? 'اتاق فعلی تو' : 'Your current room'}</small></span><strong>204</strong></div>
				</div>
			</aside>
		</section>
	{:else if complete}
		<section class="result" aria-labelledby="result-title">
			<p class="eyebrow">{isFa ? 'انگلیسی · درس ۰۱' : 'ENGLISH · LESSON 01'}</p>
			<div class="success-mark" aria-hidden="true">✓</div>
			<h1 id="result-title">{isFa ? 'مأموریت انجام شد.' : 'Sorted.'}</h1>
			<p class="lead">{isFa ? 'مشکل را توضیح دادی، راه‌حلی انتخاب کردی، هزینه را پرسیدی و آن را تأیید کردی — با کلمات خودت.' : 'You explained the problem, chose a solution, checked the cost and confirmed it, in your own words.'}</p>
			<div class="result-stats"><span><strong>{replies.length}</strong> {isFa ? 'پاسخ' : replies.length === 1 ? 'reply' : 'replies'}</span><span><strong>{averageWords}</strong> {isFa ? 'کلمه در هر پاسخ (میانگین)' : 'words per reply on average'}</span></div>
			<p class="small-note">{isFa ? 'این نتیجه نشان می‌دهد که به هدف‌های گفت‌وگو رسیدی؛ نمرهٔ زبان یا تلفظ نیست.' : 'This records that you reached the goals of the conversation, rather than a language or pronunciation score.'}</p>
			<div class="takeaways upgrades" aria-live="polite"><h2>{isFa ? 'طبیعی‌تر بگو' : 'Say it more naturally'}</h2>
				{#if review === 'loading'}<p class="small-note">{isFa ? 'در حال بررسی جمله‌هایت…' : 'Looking back at what you said…'}</p>
				{:else if review === 'ready' && upgrades.length}
					<p class="small-note">{isFa ? 'جمله‌های خودت، همان‌طور که یک انگلیسی‌زبان در این موقعیت می‌گوید. بلند تکرارشان کن.' : 'Your own sentences, the way a fluent speaker might say them here. Try saying them out loud.'}</p>
					{#each upgrades as upgrade}<div class="correction"><p lang="en" dir="ltr"><span class="said">{upgrade.original}</span> <span aria-hidden="true">→</span> <strong>{upgrade.better}</strong></p><p>{text(upgrade.why)}</p>{#if voiceAvailable}<button type="button" class="listen-line" onclick={() => speakReception(upgrade.better)}>{isFa ? 'شنیدن' : 'Listen'}</button>{/if}</div>{/each}
				{:else if review === 'ready'}<p class="small-note">{isFa ? 'جمله‌هایت همین حالا هم طبیعی بودند. آفرین!' : 'Your sentences already sounded natural. Well done!'}</p>
				{:else if review === 'limit'}<p class="small-note">{isFa ? 'سهمیهٔ امروز هوش مصنوعی تمام شده است؛ فردا دوباره امتحان کن.' : 'Today’s AI allowance is used up, so the review isn’t available until tomorrow.'}</p>
				{:else if review === 'failed'}<p class="small-note">{isFa ? 'بررسی جمله‌ها انجام نشد.' : 'The review couldn’t load.'} <button type="button" class="text-button" onclick={() => void loadReview()}>{isFa ? 'دوباره تلاش کن' : 'Try again'}</button></p>{/if}
			</div>
			{#if scene.corrections.length}
				<div class="takeaways"><h2>{isFa ? 'برای دفعهٔ بعد' : 'For next time'}</h2>
					{#each scene.corrections as correction}<div class="correction"><p lang="en" dir="ltr">{correction.original} <span aria-hidden="true">→</span> <strong>{correction.improved}</strong></p><p>{text(correction.note)}</p></div>{/each}
				</div>
			{/if}
			<form method="POST" action="?/complete" bind:this={saveForm} use:enhance={() => {
				saving = true;
				return async ({ result, update }) => {
					try {
						if (result.type === 'error') form = { error: 'save_failed' };
						else { await update({ reset: false, invalidateAll: false }); if (result.type === 'success') { saved = true; clearPracticeDraft(data.learnerId); } }
					} finally { saving = false; }
				};
			}}>
				<input type="hidden" name="result" value={payload} />
				{#if saved}<p class="save-status" role="status">✓ {isFa ? 'نتیجه در حسابت ذخیره شد.' : 'Completion saved to your account.'}</p>
				{:else}
					{#if form?.error}<p class="error" role="alert">{isFa ? 'نتیجه ذخیره نشد. اتصال و ورود به حساب را بررسی کن، سپس دوباره تلاش کن. گفت‌وگو در این صفحه باقی مانده است.' : 'Completion could not be saved. Check your connection and sign-in, then retry. Your conversation is still here.'}</p>{/if}
					<button class="primary" disabled={saving}>{saving ? (isFa ? 'در حال ذخیره…' : 'Saving…') : (isFa ? 'ذخیرهٔ نتیجه' : 'Save completion')}</button>
				{/if}
			</form>
			<div class="result-actions"><button class="secondary" disabled={saving} onclick={() => start(scene.variant === 'lift' ? 'street' : 'lift')}>{isFa ? 'یک بار دیگر، با تغییری کوچک' : 'Try again with a small twist'}</button><button class="text-button" disabled={saving} onclick={returnToIntro}>{isFa ? 'بازگشت به درس' : 'Back to the lesson'}</button></div>
		</section>
	{:else}
		<div class="session-heading"><div><p class="eyebrow">{isFa ? 'درس ۰۱ · یک اتاق آرام‌تر' : 'LESSON 01 · A QUIETER ROOM'}</p><h1>{isFa ? 'در پذیرش هتل' : 'At the reception desk'}</h1></div><button class="text-button" onclick={() => start(scene.variant)}>{isFa ? 'شروع دوباره' : 'Start again'}</button></div>
		<div class="session-grid">
			<section class="conversation-panel" aria-label={isFa ? 'گفت‌وگوی هتل' : 'Hotel conversation'}>
				<div class="reception-bar"><div class="avatar" aria-hidden="true">J</div><div><strong>Jamie</strong><small>{isFa ? 'پذیرش · Willow Hotel' : 'Reception · Willow Hotel'}</small></div>{#if voiceAvailable}<button type="button" class="voice-toggle" aria-pressed={voiceOn} onclick={toggleReceptionVoice}>{voiceOn ? (isFa ? 'صدای جیمی روشن' : 'Jamie’s voice on') : (isFa ? 'صدای جیمی خاموش' : 'Jamie’s voice off')}</button>{/if}</div>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex (The scrollable conversation history must be reachable for keyboard scrolling.) -->
				<div class="transcript" bind:this={conversation} role="region" aria-label={isFa ? 'تاریخچهٔ گفت‌وگو' : 'Conversation history'} tabindex="0" dir="ltr">
					<div class="turns" role="log" aria-live="polite" aria-relevant="additions">
					{#each scene.turns as turn, index (index)}<div class="turn" class:learner={turn.speaker === 'learner'}><small>{turn.speaker === 'learner' ? 'You' : 'Jamie'}</small><p lang="en">{turn.text}</p>{#if turn.speaker === 'reception' && voiceAvailable}<button type="button" class="listen-line" onclick={() => speakReception(turn.text)}>{isFa ? 'شنیدن جیمی' : 'Listen to Jamie'}</button>{/if}</div>{/each}
					{#if pending}<div class="turn learner pending"><small>You</small><p lang="en">{pending}</p></div><p class="typing">{isFa ? 'جیمی در حال فکر کردن است…' : 'Jamie is thinking…'}</p>{/if}
					</div>
				</div>
				<div class="composer">
					<p class="step-guide"><span>{isFa ? 'نوبت تو' : 'Your turn'}</span>{isFa ? 'با جمله‌های کامل جواب بده. جواب درست یا غلطی وجود ندارد.' : 'Answer in full sentences. There’s no right or wrong answer.'}</p>
					{#if feedback}<div class="feedback" role="status">{text(feedback)}</div>{/if}
					{#if latestCorrection}<div class="feedback" role="status"><strong>{isFa ? 'شکل طبیعی‌تر:' : 'A clearer way to say it:'}</strong> <span lang="en" dir="ltr">{latestCorrection.improved}</span><br />{text(latestCorrection.note)}</div>{/if}
					{#if outOfTurns}<div class="feedback" role="status">{isFa ? 'این گفت‌وگو به سقف نوبت‌ها رسیده است. دوباره شروع کن و راه دیگری را امتحان کن.' : 'This conversation has reached its turn limit. Start again and try another way.'}</div>{/if}
					{#if voiceMessage}<div class="voice-message" role="status">{voiceMessage}</div>{/if}
					<form onsubmit={e => { e.preventDefault(); void send(); }}>
						<label for="reply">{isFa ? 'پاسخ تو به انگلیسی' : 'Your reply in English'}</label>
						<textarea id="reply" bind:this={input} bind:value={draft} lang="en" dir="ltr" rows="3" maxlength={MAX_REPLY} disabled={checking || outOfTurns} placeholder={isFa ? 'پاسخت را بگو یا بنویس…' : 'Say or type your reply…'} aria-describedby="reply-help" onkeydown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); void send(); } }}></textarea>
						{#key replies.length}<EnglishSpeechInput {isFa} disabled={checking || outOfTurns} onTranscript={value => { draft = value; void tick().then(() => input?.focus()); }} />{/key}
						<div class="send-row"><span></span><button class="primary" disabled={!draft.trim() || checking || outOfTurns}>{checking ? (isFa ? 'جیمی در حال پاسخ…' : 'Jamie is replying…') : (isFa ? 'ارسال پاسخ' : 'Send reply')} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button></div>
					</form>
					<p id="reply-help" class="small-note">{isFa ? 'جیمی را هوش مصنوعی بازی می‌کند: هر پاسخی که می‌فرستی همراه با گفت‌وگوی قبلی به ارائه‌دهندهٔ هوش مصنوعی فرستاده می‌شود، و اگر لازم باشد جملهٔ روشن‌تری پیشنهاد می‌شود.' : 'Jamie is played by AI: each reply you send goes to an AI provider with the conversation so far, and it may suggest a clearer sentence.'}</p>
				{#key replies.length}<PracticeVoice {isFa} />{/key}
				</div>
			</section>
			<aside class="mission-sidebar"><p class="eyebrow">{isFa ? 'هدف‌های تو' : 'YOUR GOALS'}</p>
				<ul class="goals">{#each GOALS as goal}<li class:met={scene.goals.includes(goal.id)}>{text(goal.label)}<span class="sr-only">{scene.goals.includes(goal.id) ? (isFa ? ' (انجام شد)' : ' (done)') : ''}</span></li>{/each}</ul>
				<div class="key-card"><span>WILLOW HOTEL<br /><small>{isFa ? 'اتاق فعلی' : 'Current room'}</small></span><strong>204</strong></div>
				<p class="small-note">{isFa ? 'هر ترتیبی که بخواهی درست است. می‌توانی پیش از تصمیم گرفتن هر سؤالی بپرسی.' : 'Any order works. Ask Jamie anything you like before you decide.'}</p></aside>
		</div>
	{/if}
</main>

<style>
	.practice-page { max-width: 1160px; margin: 0 auto; padding: 24px 24px 64px; color: var(--ink); }
	.display-control { display: flex; align-items: center; gap: 8px; color: var(--ink-soft); font-size: .8rem; }
	select { min-height: 40px; padding: 5px 8px; border: 1px solid var(--control-border); border-radius: 8px; background: var(--paper-raised); color: var(--ink); }
	.eyebrow { font-size: .76rem; letter-spacing: .12em; font-weight: 600; color: var(--accent-deep); margin-bottom: 14px; }
	h1, h2 { font-family: var(--font-display); font-weight: 500; }
	h1 { font-size: clamp(2rem, 4.5vw, 3.6rem); line-height: 1.12; margin-bottom: 20px; }
	h2 { font-size: 1.55rem; margin-bottom: 16px; }
	p { line-height: 1.65; }
	.welcome { display: grid; grid-template-columns: 1.2fr 1fr; gap: 64px; align-items: center; padding: 44px 0; }
	.lead { font-size: 1.1rem; color: var(--ink-soft); max-width: 620px; }
	.tags { display: flex; flex-wrap: wrap; gap: 10px; margin-block: 24px; }
	.tags span { font-size: .75rem; padding: 6px 10px; border: 1px solid var(--line); border-radius: 30px; }
	.instructions, .small-note { font-size: .85rem; color: var(--ink-soft); }
	.instructions { margin-bottom: 26px; }
	button { font: inherit; cursor: pointer; }
	.primary { display: inline-flex; gap: 18px; align-items: center; justify-content: center; min-height: 48px; padding: 12px 22px; background: var(--accent); color: var(--on-accent); border: 1px solid var(--accent); border-radius: 10px; font-weight: 600; }
	.primary:hover { background: var(--accent-deep); }
	.secondary { min-height: 48px; padding: 12px 18px; background: var(--paper-raised); border: 1px solid var(--control-border); border-radius: 10px; color: var(--ink); }
	.text-button { min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font-size: .88rem; }
	button:disabled { opacity: .55; cursor: default; }
	button:focus-visible, textarea:focus-visible, select:focus-visible, .transcript:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	.briefing { border: 1px solid var(--control-border); border-radius: 20px; overflow: hidden; background: var(--paper-raised); }
	.brief-body { padding: 26px; }
	ol { padding-inline-start: 22px; color: var(--ink-soft); line-height: 1.9; }
	.key-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px; margin-top: 22px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper-sunken); direction: ltr; }
	.key-card span { letter-spacing: .12em; font-size: .72rem; }
	.key-card small { letter-spacing: 0; font-size: .78rem; color: var(--ink-soft); }
	.key-card strong { font-family: var(--font-display); font-size: 2.2rem; }
	.hotel-art { height: 170px; position: relative; background: #153c3b; overflow: hidden; }
	.moon { position: absolute; width: 36px; height: 36px; background: #f8dfa1; border-radius: 50%; right: 19%; top: 25px; }
	.hotel { position: absolute; bottom: -8px; left: 22%; width: 47%; text-align: center; background: #f1dec0; border: 9px solid #ddc4a1; border-radius: 7px 7px 0 0; }
	.hotel > span { display: block; padding: 8px; letter-spacing: .22em; font-size: .65rem; color: #163c3b; }
	.windows { font-size: 23px; line-height: 1; letter-spacing: 8px; color: #3d6260; }
	.door { height: 28px; width: 28px; background: #153c3b; margin: 9px auto 0; border-radius: 12px 12px 0 0; }
	.session-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 32px 0 24px; }
	.session-heading h1 { font-size: 2rem; margin-bottom: 0; }
	.session-heading .eyebrow { margin-bottom: 8px; }
	.session-grid { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 28px; align-items: start; }
	.conversation-panel { border: 1px solid var(--control-border); border-radius: 18px; overflow: hidden; background: var(--paper-raised); }
	.reception-bar { display: flex; align-items: center; gap: 12px; padding: 18px 24px; border-bottom: 1px solid var(--line); }
	.avatar { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: var(--accent-wash); color: var(--accent-deep); font-family: var(--font-display); font-size: 1.4rem; }
	.reception-bar small { display: block; color: var(--ink-soft); font-size: .75rem; margin-top: 3px; }
	.voice-toggle { margin-inline-start: auto; min-height: 44px; padding: 7px 10px; border: 1px solid var(--control-border); border-radius: 9px; background: var(--paper-raised); color: var(--accent-deep); font-size: .75rem; font-weight: 600; }
	.transcript { max-height: 370px; min-height: 175px; overflow-y: auto; padding: 24px; background: var(--paper-sunken); }
	.turns { display: flex; flex-direction: column; gap: 18px; }
	.turn { width: fit-content; max-width: 90%; border: 1px solid var(--line); border-radius: 12px 12px 12px 3px; background: var(--paper-raised); padding: 12px 16px; }
	.turn small { display: block; color: var(--ink-soft); font-size: .7rem; margin-bottom: 5px; }
	.turn p { margin: 0; font-size: 1rem; }
	.listen-line { min-height: 36px; margin-top: 7px; padding: 2px 0; border: 0; background: none; color: var(--accent-deep); font-size: .78rem; font-weight: 600; }
	.turn.learner { align-self: flex-end; background: var(--accent-wash); border-radius: 12px 12px 3px 12px; }
	.composer { padding: 20px 24px 0; }
	.step-guide { display: flex; align-items: baseline; gap: 10px; color: var(--ink-soft); font-size: .88rem; margin-bottom: 16px; }
	.step-guide span { white-space: nowrap; font-weight: 600; color: var(--accent-deep); }
	.voice-message { padding: 10px 12px; margin-bottom: 14px; border-radius: 9px; background: var(--attention-wash); color: var(--attention); font-size: .85rem; }
	label { display: block; margin-bottom: 8px; font-size: .85rem; font-weight: 600; }
	textarea { width: 100%; resize: vertical; min-height: 80px; padding: 12px; border: 1px solid var(--control-border); border-radius: 10px; background: var(--paper); color: var(--ink); font: inherit; }
	.send-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 10px; }
	.composer > .small-note { margin: 14px 0; font-size: .76rem; }
	.turn.pending { opacity: .7; }
	.typing { color: var(--ink-soft); font-size: .85rem; font-style: italic; }
	.goals { list-style: none; padding: 0; margin: 0 0 20px; display: grid; gap: 10px; }
	.goals li { display: flex; gap: 10px; align-items: baseline; color: var(--ink-soft); font-size: .88rem; line-height: 1.5; }
	.goals li::before { content: '○'; color: var(--ink-soft); }
	.goals li.met { color: var(--ink); }
	.goals li.met::before { content: '✓'; color: var(--accent-deep); font-weight: 700; }
	.feedback { padding: 12px 14px; background: var(--attention-wash); color: var(--attention); border-radius: 10px; margin-bottom: 16px; font-size: .88rem; line-height: 1.6; }
	.mission-sidebar { padding-top: 12px; }
	.mission-sidebar .key-card { margin: 0 0 24px; }
	.mission-sidebar > p:not(.eyebrow) { color: var(--ink-soft); font-size: .88rem; }
	.result { max-width: 710px; margin: 40px auto; text-align: center; }
	.success-mark { display: grid; place-items: center; margin: 24px auto; width: 64px; height: 64px; border-radius: 50%; background: var(--accent-wash); color: var(--accent-deep); font-size: 2rem; }
	.result .lead { margin: 0 auto 20px; }
	.result-stats { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px 28px; margin-block: 20px; color: var(--ink-soft); }
	.result-stats strong { color: var(--ink); }
	.takeaways { padding: 24px; background: var(--paper-raised); border: 1px solid var(--line); border-radius: 14px; margin-block: 24px; text-align: start; }
	.correction + .correction { border-top: 1px solid var(--line); margin-top: 14px; padding-top: 14px; }
	.correction p { font-size: .9rem; }
	.correction p + p { color: var(--ink-soft); margin-top: 8px; }
	.correction .said { color: var(--ink-soft); }
	.result-actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 16px; margin-top: 24px; }
	.save-status, .completed-label { color: var(--accent-deep); margin-block: 16px; }
	.error { color: var(--miss); margin-bottom: 16px; }
	@media (max-width: 960px) { .welcome { gap: 28px; } .session-grid { grid-template-columns: minmax(0, 1fr) 230px; gap: 20px; } }
	@media (max-width: 720px) { .practice-page { padding: 16px 16px 40px; } .welcome { grid-template-columns: 1fr; padding-top: 24px; } .briefing { max-width: 520px; } .session-grid { grid-template-columns: 1fr; } .session-heading { margin-top: 24px; } .session-heading h1 { font-size: 1.65rem; } .reception-bar, .composer { padding-inline: 16px; } .reception-bar { flex-wrap: wrap; } .voice-toggle { margin-inline-start: 0; } .transcript { padding: 16px; max-height: 290px; } .display-control { font-size: 0; } .display-control select { font-size: .85rem; } .primary { padding-inline: 16px; } .result { margin-top: 30px; } }
</style>
