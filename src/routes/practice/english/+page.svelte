<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import CourseSwitcher from '$lib/components/CourseSwitcher.svelte';
	import PracticeVoice from '$lib/components/PracticeVoice.svelte';
	import EnglishSpeechInput from '$lib/components/EnglishSpeechInput.svelte';
	import { startHotel, replyToHotel, applyHotelChoice, isHotelAiEligible, hotelChoices, stageHelp, STAGES, HOTEL_ID, type Stage, type DisplayText, type Variant } from '$lib/practice/hotel';
	import { getLanguage, setLanguage, loadPracticeDraft, savePracticeDraft, clearPracticeDraft } from '$services/data-layer';
	import { trackEvent } from '$services/analytics';

	let { data, form }: PageProps = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const text = (value: DisplayText) => value[language];
	let scene = $state(startHotel());
	let started = $state(false), ready = $state(false), examples = $state(false), saving = $state(false), saved = $state(false), checking = $state(false);
	let draft = $state(''), feedback = $state<DisplayText | null>(null);
	let latestCorrection = $state<{ improved: string; note: DisplayText } | null>(null);
	let replies = $state<string[]>([]), resolved = $state<(string | null)[]>([]), hints = $state<Stage[]>([]);
	let voiceAvailable = $state(false), voiceOn = $state(true), voiceMessage = $state('');
	let englishVoice: SpeechSynthesisVoice | null = null;
	let generation = 0;
	let input: HTMLTextAreaElement | undefined = $state();
	let conversation: HTMLDivElement | undefined = $state();
	let saveForm: HTMLFormElement | undefined = $state();
	const complete = $derived(scene.stage === 'complete');
	const stepIndex = $derived(complete ? 6 : STAGES.indexOf(scene.stage));
	const payload = $derived(JSON.stringify({ variant: scene.variant, trail: scene.trail, hints: hints.length }));
	function refreshVoices() {
		voiceAvailable = !!window.speechSynthesis;
		const english = window.speechSynthesis?.getVoices().filter(voice => voice.lang.toLowerCase().startsWith('en')) ?? [];
		englishVoice = english.find(voice => voice.localService) ?? english[0] ?? null;
	}
	function stopReceptionVoice() { window.speechSynthesis?.cancel(); }
	function speakReception(line: string) {
		if (!voiceAvailable || !line) return;
		stopReceptionVoice(); voiceMessage = '';
		const utterance = new SpeechSynthesisUtterance(line);
		if (englishVoice) utterance.voice = englishVoice;
		utterance.lang = englishVoice?.lang ?? 'en-US'; utterance.rate = .88;
		utterance.onerror = event => {
			if (event.error === 'interrupted' || event.error === 'canceled') return;
			voiceMessage = isFa ? 'صدای پذیرش پخش نشد. می‌توانی متن را بخوانی و ادامه بدهی.' : 'Reception audio could not play. You can read the line and continue.';
		};
		window.speechSynthesis.speak(utterance);
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
	function remember() { savePracticeDraft(data.learnerId, scene.variant, replies, hints, resolved); }
	onMount(() => {
		refreshVoices();
		window.speechSynthesis?.addEventListener('voiceschanged', refreshVoices);
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		const previous = loadPracticeDraft(data.learnerId);
		if (previous) {
			scene = startHotel(previous.variant);
			for (const [index, reply] of previous.replies.entries()) scene = (previous.resolved?.[index] ? applyHotelChoice(scene, previous.resolved[index]!, reply) : replyToHotel(scene, reply)).state;
			replies = previous.replies; resolved = previous.replies.map((_, index) => previous.resolved?.[index] ?? null); hints = previous.hints; started = true;
		}
		ready = true;
		return () => { stopReceptionVoice(); window.speechSynthesis?.removeEventListener('voiceschanged', refreshVoices); };
	});
	async function changeDisplay(value: 'en' | 'fa') { language = value; await setLanguage(value); }
	async function start(variant: Variant = 'lift') {
		generation++; checking = false; stopReceptionVoice(); scene = startHotel(variant); replies = []; resolved = []; hints = []; feedback = null; latestCorrection = null; draft = ''; examples = false; voiceMessage = '';
		form = null; saved = false; started = true; remember();
		event('conversation_started', { replay: !!data.completed });
		await tick(); input?.focus();
		if (voiceOn) speakReception(scene.turns[0].text);
	}
	function openExamples() {
		examples = !examples;
		if (examples && scene.stage !== 'complete' && !hints.includes(scene.stage)) {
			hints = [...hints, scene.stage]; remember(); event('hint_opened', { index: stepIndex });
		}
	}
	async function fillExample(value: string) { draft = value; await tick(); input?.focus(); }
	async function send() {
		if (complete || checking) return;
		if (scene.trail.length >= 40) {
			feedback = { en: 'This practice round has reached its turn limit. Start again to try a shorter conversation.', fa: 'این دور به پایان ظرفیت گفت‌وگو رسیده است. دوباره شروع کن و یک گفت‌وگوی کوتاه‌تر را امتحان کن.' }; return;
		}
		const reply = draft.trim();
		latestCorrection = null;
		const localResult = replyToHotel(scene, reply);
		let result = localResult;
		let aiChoice: string | null = null;
		if (isHotelAiEligible(scene, reply)) {
			checking = true;
			const current = generation;
			try {
				const response = await fetch('/api/english/interpret', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: scene.stage, variant: scene.variant, utterance: reply }) });
				if (current !== generation) return;
				if (response.ok) {
					const interpretation = await response.json();
					if (current !== generation) return;
					if (typeof interpretation.choiceId === 'string') {
						const correction = interpretation.correction;
						const known = localResult.understood && localResult.state.trail.at(-1) === interpretation.choiceId && localResult.state.corrections.length > scene.corrections.length ? localResult.state.corrections.at(-1) : null;
						const suggested = correction && typeof correction.improved === 'string' && typeof correction.note?.en === 'string' && typeof correction.note?.fa === 'string' ? correction : known ? { improved: known.improved, note: known.note } : null;
						const evaluated = applyHotelChoice(scene, interpretation.choiceId, reply, suggested);
						if (evaluated.understood) { result = evaluated; aiChoice = interpretation.choiceId; }
					} else if (!localResult.understood) {
						result = { ...localResult, feedback: { en: 'That does not answer Jamie’s question yet. Try a short reply about this hotel situation or open the examples.', fa: 'این پاسخ هنوز جواب پرسش جیمی نیست. پاسخی کوتاه دربارهٔ موقعیت هتل بده یا مثال‌ها را باز کن.' } };
					}
				} else if (!localResult.understood && (response.status >= 500 || response.status === 429)) {
					result = { ...result, feedback: { en: 'I can’t check that wording right now. Try a short reply or open the examples.', fa: 'الان نمی‌توانم این جمله را بررسی کنم. پاسخ کوتاه‌تری بنویس یا مثال‌ها را باز کن.' } };
				}
			} catch {
				if (current !== generation) return;
				if (!localResult.understood) result = { ...result, feedback: { en: 'I can’t check that wording right now. Try a short reply or open the examples.', fa: 'الان نمی‌توانم این جمله را بررسی کنم. پاسخ کوتاه‌تری بنویس یا مثال‌ها را باز کن.' } };
			} finally { if (current === generation) checking = false; }
		}
		feedback = result.understood ? null : result.feedback;
		if (!reply) return;
		event('answer_submitted', { index: stepIndex, correct: result.understood, ai_rescued: !!aiChoice && !localResult.understood });
		if (result.understood) {
			latestCorrection = result.state.corrections.length > scene.corrections.length ? result.state.corrections.at(-1) ?? null : null;
			replies = [...replies, reply]; resolved = [...resolved, aiChoice]; scene = result.state; draft = ''; examples = false; remember();
			await tick();
			if (conversation) conversation.scrollTop = conversation.scrollHeight;
			const lastReception = [...scene.turns].reverse().find(turn => turn.speaker === 'reception');
			if (voiceOn && lastReception) speakReception(lastReception.text);
			if (complete) { event('conversation_completed', { count: replies.length }); saveForm?.requestSubmit(); }
			else input?.focus();
		}
	}
	function returnToIntro() {
		generation++; checking = false; stopReceptionVoice(); clearPracticeDraft(data.learnerId); started = false; feedback = null; latestCorrection = null; draft = ''; form = null;
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
				<p class="lead">{isFa ? 'ساعت ۱۰ شب است و اتاقت پر از سروصداست. به پذیرش برو و برای یک خواب راحت، اتاقت را عوض کن.' : 'It’s 10 pm and your room is too noisy. Visit reception and arrange a move so you can get some sleep.'}</p>
				<div class="tags"><span>{isFa ? 'حدود ۵ تا ۸ دقیقه' : 'About 5–8 minutes'}</span><span>{isFa ? 'مکالمهٔ روزمره' : 'Everyday conversation'}</span></div>
				<p class="instructions">{isFa ? 'با پذیرش یک نوبت در میان گفت‌وگو کن. پاسخ انگلیسی‌ات را بگو یا بنویس، سپس به سؤال بعدی جیمی گوش بده. اگر لازم بود از مثال‌ها کمک بگیر.' : 'Talk with reception one turn at a time. Speak or type your English reply, then listen to Jamie’s next question. Open the examples if you need help.'}</p>
				{#if data.completed || saved}<p class="completed-label">✓ {isFa ? 'این درس را قبلاً تمام کرده‌ای. دوباره تمرین کن.' : 'You’ve completed this lesson. You can practise again.'}</p>{/if}
				<button class="primary start" disabled={!ready} onclick={() => start(data.completed?.variant === 'lift' ? 'street' : 'lift')}>{data.completed || saved ? (isFa ? 'تمرین دوباره' : 'Practise again') : (isFa ? 'شروع گفت‌وگو' : 'Start the conversation')} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
			</div>
			<aside class="briefing" aria-label={isFa ? 'اطلاعات مأموریت' : 'Your mission brief'}>
				<div class="hotel-art" aria-hidden="true"><div class="moon"></div><div class="hotel"><span>WILLOW</span><div class="windows">▦ ▦ ▦<br />▦ ▦ ▦<br />▦ ▦ ▦</div><div class="door"></div></div></div>
				<div class="brief-body"><p class="eyebrow">{isFa ? 'مأموریت تو' : 'YOUR MISSION'}</p><h2>{isFa ? 'خواب راحت، بدون هزینهٔ اضافه' : 'Better sleep. No extra charge.'}</h2>
					<ol><li>{isFa ? 'مشکل را توضیح بده.' : 'Explain the problem.'}</li><li>{isFa ? 'یک اتاق آرام‌تر بخواه.' : 'Ask for a quieter room.'}</li><li>{isFa ? 'قیمت را بررسی کن و جابه‌جایی را تأیید کن.' : 'Check the price and confirm the move.'}</li></ol>
					<div class="key-card"><span>WILLOW HOTEL<br /><small>{isFa ? 'اتاق فعلی تو' : 'Your current room'}</small></span><strong>204</strong></div>
				</div>
			</aside>
		</section>
	{:else if complete}
		<section class="result" aria-labelledby="result-title">
			<p class="eyebrow">{isFa ? 'انگلیسی · درس ۰۱' : 'ENGLISH · LESSON 01'}</p>
			<div class="success-mark" aria-hidden="true">✓</div>
			<h1 id="result-title">{isFa ? 'مأموریت انجام شد.' : 'A quieter room is yours.'}</h1>
			<p class="lead">{isFa ? 'اتاق ۵۱۲ را گرفتی، بدون هزینهٔ اضافه. بعد هم سؤال قیمت را در موقعیتی تازه تمرین کردی.' : 'You arranged room 512 with no extra charge, then practised asking about the price in a new situation.'}</p>
			<div class="result-stats"><span><strong>{replies.length}</strong> {isFa ? 'پاسخ شناخته‌شده' : 'supported replies'}</span><span><strong>{hints.length}</strong> {isFa ? 'مرحله با کمک مثال' : hints.length === 1 ? 'step with examples' : 'steps with examples'}</span></div>
			<p class="small-note">{isFa ? 'این نتیجه، انجام مأموریت هدایت‌شده را نشان می‌دهد؛ نمرهٔ زبان یا تلفظ نیست.' : 'This records completion of the guided mission, rather than a language or pronunciation score.'}</p>
			{#if scene.corrections.length}
				<div class="takeaways"><h2>{isFa ? 'برای دفعهٔ بعد' : 'For next time'}</h2>
					{#each scene.corrections as correction}<div class="correction"><p lang="en" dir="ltr">{correction.original} <span aria-hidden="true">→</span> <strong>{correction.improved}</strong></p><p>{text(correction.note)}</p></div>{/each}
				</div>
			{/if}
			<div class="takeaways"><h2>{isFa ? 'سه جمله برای همراه داشتن' : 'Three phrases to take with you'}</h2><ul lang="en" dir="ltr"><li>My room is too noisy.</li><li>Could I have a quieter room, please?</li><li>Is there an extra charge?</li></ul></div>
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
					{#each scene.turns as turn, index (index)}<div class="turn" class:learner={turn.speaker === 'learner'} class:coach={turn.speaker === 'coach'}><small>{turn.speaker === 'learner' ? 'You' : turn.speaker === 'coach' ? 'Practice coach' : 'Jamie'}</small><p lang="en">{turn.text}</p>{#if turn.speaker === 'reception' && voiceAvailable}<button type="button" class="listen-line" onclick={() => speakReception(turn.text)}>{isFa ? 'شنیدن جیمی' : 'Listen to Jamie'}</button>{/if}</div>{/each}
					</div>
				</div>
				<div class="composer">
					<p class="step-guide"><span>{isFa ? 'نوبت تو' : 'Your turn'}</span>{text(stageHelp[scene.stage])}</p>
					{#if feedback}<div class="feedback" role="status">{text(feedback)}</div>{/if}
					{#if latestCorrection}<div class="feedback" role="status"><strong>{isFa ? 'شکل طبیعی‌تر:' : 'A clearer way to say it:'}</strong> <span lang="en" dir="ltr">{latestCorrection.improved}</span><br />{text(latestCorrection.note)}</div>{/if}
					{#if voiceMessage}<div class="voice-message" role="status">{voiceMessage}</div>{/if}
					<form onsubmit={e => { e.preventDefault(); void send(); }}>
						<label for="reply">{isFa ? 'پاسخ تو به انگلیسی' : 'Your reply in English'}</label>
						<textarea id="reply" bind:this={input} bind:value={draft} lang="en" dir="ltr" rows="2" maxlength="300" disabled={checking} placeholder={isFa ? 'پاسخ انگلیسی را اینجا بنویس…' : 'Type a short reply…'} aria-describedby="reply-help" onkeydown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); void send(); } }}></textarea>
						{#key scene.trail.length}<EnglishSpeechInput {isFa} disabled={checking} onTranscript={value => { draft = value; void tick().then(() => input?.focus()); }} />{/key}
						<div class="send-row"><button type="button" class="text-button" aria-expanded={examples} aria-controls="reply-examples" onclick={openExamples}>{examples ? (isFa ? 'پنهان کردن مثال‌ها' : 'Hide examples') : (isFa ? 'کمک با مثال' : 'Show examples')}</button><button class="primary" disabled={!draft.trim() || checking}>{checking ? (isFa ? 'در حال بررسی…' : 'Checking…') : (isFa ? 'ارسال پاسخ' : 'Send reply')} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button></div>
					</form>
						{#if examples}<div id="reply-examples" class="examples"><p>{isFa ? 'یک مثال را برای ویرایش انتخاب کن، سپس ارسال کن.' : 'Choose an example to edit, then send it.'}</p>{#each hotelChoices(scene).filter(option => option.id !== 'related') as option}<button type="button" lang="en" dir="ltr" onclick={() => fillExample(option.text)}>{option.text}</button>{/each}</div>{/if}
						<p id="reply-help" class="small-note">{isFa ? 'پاسخت معمولاً با هوش مصنوعی از نظر ارتباط با گفت‌وگو و نکته‌های زبانی بررسی می‌شود. متن به ارائه‌دهندهٔ هوش مصنوعی فرستاده می‌شود؛ اگر در دسترس نباشد، مثال‌های آماده هم کار می‌کنند.' : 'AI usually checks whether your reply fits the conversation and suggests a clearer sentence when useful. Your reply text is sent to an AI provider; prepared examples still work if AI is unavailable.'}</p>
				{#key scene.trail.length}<PracticeVoice {isFa} />{/key}
				</div>
			</section>
			<aside class="mission-sidebar"><p class="eyebrow">{isFa ? 'کارت اتاق تو' : 'YOUR ROOM CARD'}</p><div class="key-card"><span>WILLOW HOTEL<br /><small>{isFa ? 'اتاق فعلی' : 'Current room'}</small></span><strong>204</strong></div><h2>{isFa ? 'موقعیت تو' : 'Your situation'}</h2><p>{isFa ? 'اتاقت پرسر‌وصداست. با جیمی گفت‌وگو کن و برای امشب یک اتاق آرام پیدا کن. می‌توانی پیش از تصمیم گرفتن سؤال بپرسی.' : 'Your room is noisy. Talk with Jamie and find a quiet room for tonight. You can ask questions before deciding.'}</p><p class="small-note">{isFa ? 'پذیرش پس از هر پاسخ تو جواب می‌دهد. هر وقت لازم بود مثال‌ها را باز کن.' : 'Reception replies after each of your turns. Open the examples whenever you need support.'}</p></aside>
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
	.turn.coach { border-style: dashed; background: transparent; }
	.composer { padding: 20px 24px 0; }
	.step-guide { display: flex; align-items: baseline; gap: 10px; color: var(--ink-soft); font-size: .88rem; margin-bottom: 16px; }
	.step-guide span { white-space: nowrap; font-weight: 600; color: var(--accent-deep); }
	.voice-message { padding: 10px 12px; margin-bottom: 14px; border-radius: 9px; background: var(--attention-wash); color: var(--attention); font-size: .85rem; }
	label { display: block; margin-bottom: 8px; font-size: .85rem; font-weight: 600; }
	textarea { width: 100%; resize: vertical; min-height: 80px; padding: 12px; border: 1px solid var(--control-border); border-radius: 10px; background: var(--paper); color: var(--ink); font: inherit; }
	.send-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 10px; }
	.composer > .small-note { margin: 14px 0; font-size: .76rem; }
	.examples { display: grid; gap: 8px; margin-top: 16px; }
	.examples p { font-size: .8rem; color: var(--ink-soft); margin: 0; }
	.examples button { border: 1px solid var(--control-border); border-radius: 8px; padding: 12px; min-height: 44px; text-align: left; background: var(--paper-sunken); color: var(--ink); }
	.feedback { padding: 12px 14px; background: var(--attention-wash); color: var(--attention); border-radius: 10px; margin-bottom: 16px; font-size: .88rem; line-height: 1.6; }
	.mission-sidebar { padding-top: 12px; }
	.mission-sidebar .key-card { margin: 0 0 24px; }
	.mission-sidebar h2 { font-size: 1.3rem; }
	.mission-sidebar > p:not(.eyebrow) { color: var(--ink-soft); font-size: .88rem; }
	.result { max-width: 710px; margin: 40px auto; text-align: center; }
	.success-mark { display: grid; place-items: center; margin: 24px auto; width: 64px; height: 64px; border-radius: 50%; background: var(--accent-wash); color: var(--accent-deep); font-size: 2rem; }
	.result .lead { margin: 0 auto 20px; }
	.result-stats { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px 28px; margin-block: 20px; color: var(--ink-soft); }
	.result-stats strong { color: var(--ink); }
	.takeaways { padding: 24px; background: var(--paper-raised); border: 1px solid var(--line); border-radius: 14px; margin-block: 24px; text-align: start; }
	.takeaways ul { padding-left: 22px; line-height: 2; }
	.correction + .correction { border-top: 1px solid var(--line); margin-top: 14px; padding-top: 14px; }
	.correction p { font-size: .9rem; }
	.correction p + p { color: var(--ink-soft); margin-top: 8px; }
	.result-actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 16px; margin-top: 24px; }
	.save-status, .completed-label { color: var(--accent-deep); margin-block: 16px; }
	.error { color: var(--miss); margin-bottom: 16px; }
	@media (max-width: 960px) { .welcome { gap: 28px; } .session-grid { grid-template-columns: minmax(0, 1fr) 230px; gap: 20px; } }
	@media (max-width: 720px) { .practice-page { padding: 16px 16px 40px; } .welcome { grid-template-columns: 1fr; padding-top: 24px; } .briefing { max-width: 520px; } .session-grid { grid-template-columns: 1fr; } .mission-sidebar { display: none; } .session-heading { margin-top: 24px; } .session-heading h1 { font-size: 1.65rem; } .reception-bar, .composer { padding-inline: 16px; } .reception-bar { flex-wrap: wrap; } .voice-toggle { margin-inline-start: 0; } .transcript { padding: 16px; max-height: 290px; } .display-control { font-size: 0; } .display-control select { font-size: .85rem; } .primary { padding-inline: 16px; } .result { margin-top: 30px; } }
</style>
