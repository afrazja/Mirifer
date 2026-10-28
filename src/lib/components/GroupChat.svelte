<script lang="ts">
	/**
	 * "Group chat" (group-chat.ts, docs/english-group-chat-spec.md): the learner plans something with
	 * AI friends in a WhatsApp-style group. One focused thing per screen:
	 * 1. the situation and the goals ("Open the chat");
	 * 2. the chat: the mic is the one main button (tap to record, tap to stop, check the words, Send);
	 *    typing is the quiet way out ("Can't talk now? Type"); friends' messages arrive one at a time;
	 * 3. the result and Mira's one note;
	 * 4. at most two of the learner's messages, a bit better, one per screen, each with "Say it again".
	 * The run is kept in this browser (onSave), so a reload comes back to it without replaying anything.
	 */
	import { onDestroy, onMount, tick } from 'svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import MixedText from '$lib/components/MixedText.svelte';
	import SayAgain from '$lib/components/SayAgain.svelte';
	import { ENGLISH_RATE, RECORDED_ENGLISH_RATE } from '$lib/practice/english-voice';
	import {
		LEARNER, MAX_CHAT_MESSAGE, chatChars, chatGoalIds, chatNote, chatTurns, chatTwistSent, learnerMessages, memberOf, startChat,
		type ChatMessage, type ChatRecord, type ChatScene, type ChatUpgrade
	} from '$lib/practice/group-chat';
	import type { DisplayText } from '$lib/practice/hotel';
	import { playAudioPromise, playAudioUrl, stopAllAudio } from '$services/tts';
	import { canRecord, startRecording, transcribeClip, type Recording } from '$services/voice-clip';

	let { isFa = false, scene, initial = null, onSave, onFocus, onSkip, onDone }: {
		isFa?: boolean;
		scene: ChatScene;
		initial?: ChatRecord | null;
		onSave?: (record: ChatRecord) => void;
		/** Mira's instruction shows on the first screen only. */
		onFocus?: (mode: 'full' | 'compact' | 'hidden') => void;
		onSkip?: () => void;
		/** Goals reached, out of all. */
		onDone: (score: { correct: number; total: number }, record: ChatRecord) => void;
	} = $props();

	const T = (en: string, fa: string) => (isFa ? fa : en);
	const N = (n: number) => (isFa ? n.toLocaleString('fa-IR') : String(n));
	const text = (value: DisplayText) => (isFa ? value.fa : value.en);
	// svelte-ignore state_referenced_locally
	const IDS = chatGoalIds(scene), CAP = chatTurns(scene), CHARS = chatChars(scene);
	// svelte-ignore state_referenced_locally
	const MEMBERS = [...scene.members.map(m => m.name), 'You'].join(', ');

	// svelte-ignore state_referenced_locally
	let record = $state<ChatRecord>(initial ?? startChat(scene));
	// svelte-ignore state_referenced_locally
	let stage = $state<'situation' | 'chat' | 'result' | 'rewrite'>(initial?.settled ? 'result' : initial && learnerMessages(initial.messages).length ? 'chat' : 'situation');
	/** Messages on screen: those already in the chat show at once; new ones arrive one by one. */
	// svelte-ignore state_referenced_locally
	let shown = $state(record.messages.length);
	let typingFrom = $state<string | null>(null);
	let composer = $state<'voice' | 'recording' | 'transcribing' | 'preview' | 'typing'>('voice');
	let typed = $state(false), draft = $state(''), heard = $state(''), heardSeconds = 0;
	let sending = $state(false), problem = $state<DisplayText | null>(null);
	// svelte-ignore state_referenced_locally
	let review = $state<'idle' | 'loading' | 'ready' | 'failed' | 'limit'>(initial?.review ? 'ready' : 'idle');
	let rewrite = $state(0);
	let openText = $state<Record<number, boolean>>({});
	let playing = $state<number | null>(null);
	let newBelow = $state(false);
	let heading: HTMLElement | undefined = $state(), input: HTMLTextAreaElement | undefined = $state(), bottom: HTMLElement | undefined = $state();
	let sheet: HTMLDialogElement | undefined = $state();
	let recording: Recording | null = null;
	let generation = 0, alive = true;

	const said = $derived(learnerMessages(record.messages).length);
	const twistSent = $derived(chatTwistSent(scene, record.messages));
	const reopened = $derived(twistSent && scene.twist?.reopens && !record.goals.includes(scene.twist.reopens) ? scene.twist.reopens : null);
	/** Every message has arrived and the chat is over. */
	const closed = $derived(record.settled && shown >= record.messages.length && !typingFrom);
	const note = $derived(chatNote(scene, record));
	const upgrades = $derived(record.review ?? []);
	const other = $derived(scene.variants.find(v => v !== record.variant) ?? scene.variants[0]);

	onMount(() => {
		if (!canRecord()) typed = true;
		if (stage !== 'situation') onFocus?.('hidden');
		if (stage === 'chat') scrollDown(true);
		if (record.settled && !record.review) void loadReview();
	});
	onDestroy(() => { alive = false; generation++; recording?.cancel(); stopAllAudio(); });

	function persist() { if (alive) onSave?.($state.snapshot(record)); }
	function go(next: typeof stage) { stage = next; queueMicrotask(() => heading?.focus()); }
	const nearBottom = () => typeof window === 'undefined' || window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
	/** Follows new messages only if the learner is already at the bottom; otherwise "New message ↓". */
	function scrollDown(force = false) {
		const follow = force || nearBottom();
		void tick().then(() => { if (follow) { bottom?.scrollIntoView({ block: 'end' }); newBelow = false; } else newBelow = true; });
	}
	const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
	const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const nameOf = (id: string) => (id === LEARNER ? T('You', 'تو') : memberOf(scene, id)?.name ?? id);
	/** A voice note's length, from its words (about 2.5 a second). */
	const noteSeconds = (message: ChatMessage) => message.seconds ?? Math.max(2, Math.round(message.text.split(/\s+/).length / 2.5));
	const clock = (seconds: number) => `0:${String(Math.min(59, seconds)).padStart(2, '0')}`;

	/** Plays a friend's voice note (only on a tap: phones block sound that doesn't start in one). */
	async function play(index: number) {
		const message = record.messages[index];
		const member = memberOf(scene, message.from);
		if (!member) return;
		if (playing === index) { stopAllAudio(); playing = null; return; }
		stopAllAudio(); recording?.stop();
		playing = index;
		const sig = sigs[message.text];
		const url = `/api/english/voice?v=1&voice=${member.voice}&scene=${encodeURIComponent(scene.id)}&text=${encodeURIComponent(message.text)}${sig ? `&sig=${encodeURIComponent(sig)}` : ''}`;
		const ok = await playAudioUrl(url, undefined, RECORDED_ENGLISH_RATE);
		if (!ok && alive && playing === index) await playAudioPromise(message.text.replace(/[\p{Extended_Pictographic}‍️]/gu, ''), ENGLISH_RATE, 'en-US').catch(() => {});
		if (playing === index) playing = null;
	}
	/** Signatures for the friends' AI-written voice notes (prepared ones need none). */
	let sigs: Record<string, string> = {};

	function open(variant = record.variant) {
		generation++; stopAllAudio(); recording?.cancel();
		if (variant !== record.variant || record.settled) { record = startChat(scene, variant); shown = record.messages.length; }
		problem = null; draft = ''; heard = ''; composer = 'voice'; review = 'idle'; rewrite = 0; openText = {};
		onFocus?.('hidden'); go('chat'); scrollDown(true);
	}

	const failure: Record<'limit' | 'unavailable' | 'signin', DisplayText> = {
		limit: { en: 'Today’s AI chat messages are used up. The limit resets at 00:00 UTC.', fa: 'سهمیهٔ امروز چت با هوش مصنوعی تمام شده است. سهمیه ساعت ۰۰:۰۰ به وقت UTC تازه می‌شود.' },
		unavailable: { en: 'Your friends can’t answer right now. Your message is still here; send it again in a moment.', fa: 'دوستانت الان نمی‌توانند جواب بدهند. پیامت هنوز اینجاست؛ کمی بعد دوباره بفرست.' },
		signin: { en: 'Your session has ended. Sign in again to continue.', fa: 'نشست تو تمام شده است. برای ادامه دوباره وارد شو.' }
	};

	// ── The composer ──
	async function record_() {
		if (composer === 'recording') { recording?.stop(); return; }
		if (composer !== 'voice' || sending) return;
		stopAllAudio(); playing = null; problem = null;
		composer = 'recording';
		const started = await startRecording('group-chat');
		if (!alive) { if (typeof started === 'object') started.cancel(); return; }
		if (started === 'unsupported' || started === 'blocked') {
			composer = 'typing'; typed = true;
			problem = started === 'blocked'
				? { en: 'Your microphone is blocked, so type your message for now. (Allow it in site settings to send voice notes.)', fa: 'میکروفون بسته است؛ فعلاً پیامت را بنویس. (برای فرستادن پیام صوتی، در تنظیمات سایت اجازه بده.)' }
				: { en: 'Voice notes don’t work in this browser, so type your message.', fa: 'پیام صوتی در این مرورگر کار نمی‌کند؛ پیامت را بنویس.' };
			return;
		}
		recording = started;
		const clip = await started.done;
		recording = null;
		if (!alive) return;
		if (clip === null) { composer = 'voice'; return; }
		if (clip === 'silent') { composer = 'voice'; problem = { en: 'I didn’t hear anything. Tap the mic and try again.', fa: 'صدایی نشنیدم. میکروفون را بزن و دوباره امتحان کن.' }; return; }
		composer = 'transcribing';
		const current = generation;
		const result = await transcribeClip(clip, 'group-chat');
		if (!alive || current !== generation) return;
		if ('error' in result) {
			if (result.error === 'failed') { composer = 'voice'; problem = { en: 'I couldn’t catch that. Try again.', fa: 'متوجه نشدم. دوباره امتحان کن.' }; return; }
			composer = 'typing'; typed = true;
			problem = result.error === 'limit'
				? { en: 'Today’s voice practice is used up. Type your message instead.', fa: 'تمرین صوتی امروز تمام شد. پیامت را بنویس.' }
				: { en: 'Voice notes aren’t available right now. Type your message instead.', fa: 'پیام صوتی الان در دسترس نیست. پیامت را بنویس.' };
			return;
		}
		const words = result.transcript.trim().slice(0, MAX_CHAT_MESSAGE);
		if (!words) { composer = 'voice'; problem = { en: 'I couldn’t catch that. Try again.', fa: 'متوجه نشدم. دوباره امتحان کن.' }; return; }
		heard = words; heardSeconds = clip.seconds; composer = 'preview';
		scrollDown(true);
	}
	function toTyping() { recording?.cancel(); typed = true; composer = 'typing'; problem = null; void tick().then(() => input?.focus()); }
	function toVoice() { typed = false; composer = 'voice'; problem = null; }

	async function send(voice: boolean) {
		const words = (voice ? heard : draft).replace(/\s+/g, ' ').trim();
		if (!words || sending || record.settled || said >= CAP) return;
		if (!voice && words.length > CHARS) { problem = { en: `Keep each message under ${CHARS} characters.`, fa: `هر پیام باید کمتر از ${N(CHARS)} نویسه باشد.` }; return; }
		problem = null; stopAllAudio(); playing = null;
		const mine: ChatMessage = voice ? { from: LEARNER, text: words, voice: true, seconds: heardSeconds } : { from: LEARNER, text: words };
		const messages = [...record.messages, mine];
		record = { ...record, messages, voiceSeconds: record.voiceSeconds + (voice ? heardSeconds : 0) };
		shown = messages.length;
		if (voice) heard = ''; else draft = '';
		composer = typed ? 'typing' : 'voice';
		sending = true; scrollDown(true);
		const current = generation;
		const first = scene.members.find(m => scene.played.includes(m.id))?.id ?? scene.members[0].id;
		const typingTimer = setTimeout(() => { if (current === generation && sending) typingFrom = first; }, 700);
		try {
			const response = await fetch('/api/english/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
				scene: scene.id, variant: record.variant, messages: messages.map(({ from, text, voice }) => ({ from, text, ...(voice ? { voice } : {}) })), goals: record.goals, proof: record.proof, quiet: record.quiet
			}) });
			if (current !== generation || !alive) return;
			if (!response.ok) { unsend(mine, voice); problem = failure[response.status === 429 ? 'limit' : response.status === 401 ? 'signin' : 'unavailable']; return; }
			const result = await response.json();
			if (current !== generation || !alive) return;
			const incoming: ChatMessage[] = Array.isArray(result.messages)
				? result.messages.filter((m: any) => typeof m?.text === 'string' && memberOf(scene, m?.from)).map((m: any) => ({ from: m.from, text: m.text, ...(m.voice ? { voice: true } : {}) }))
				: [];
			if (!incoming.length || !Array.isArray(result.goals)) { unsend(mine, voice); problem = failure.unavailable; return; }
			for (const m of result.messages) if (typeof m?.voiceSig === 'string') sigs[m.text] = m.voiceSig;
			record = {
				...record, messages: [...record.messages, ...incoming],
				goals: IDS.filter(id => result.goals.includes(id)), proof: typeof result.proof === 'string' ? result.proof : null,
				done: result.done === true, settled: result.settled === true || result.done === true,
				quiet: typeof result.quiet === 'number' ? result.quiet : 0
			};
			persist();
			clearTimeout(typingTimer);
			await arrive(incoming, current);
			if (record.settled) void loadReview();
		} catch {
			if (current === generation) { unsend(mine, voice); problem = failure.unavailable; }
		} finally {
			clearTimeout(typingTimer);
			if (current === generation) { sending = false; typingFrom = null; }
		}
	}
	/** The round failed: the learner's message goes back into the composer. */
	function unsend(mine: ChatMessage, voice: boolean) {
		record = { ...record, messages: record.messages.slice(0, -1), voiceSeconds: record.voiceSeconds - (voice ? mine.seconds ?? 0 : 0) };
		shown = record.messages.length;
		if (voice) { heard = mine.text; heardSeconds = mine.seconds ?? 0; composer = 'preview'; } else draft = mine.text;
	}
	/** The friends' messages, one at a time, each after a short "typing…". */
	async function arrive(incoming: ChatMessage[], current: number) {
		for (const [i, message] of incoming.entries()) {
			typingFrom = message.from;
			const typing = Math.min(i === 0 ? 1500 : 2500, 500 + message.text.length * 25);
			await wait(reduced() ? Math.min(typing, 600) : typing);
			if (current !== generation || !alive) return;
			shown += 1; typingFrom = null;
			scrollDown();
			if (i < incoming.length - 1) await wait(400);
		}
	}

	async function loadReview() {
		if (review === 'loading' || review === 'ready') return;
		const current = generation;
		review = 'loading';
		try {
			const response = await fetch('/api/english/chat/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
				scene: scene.id, variant: record.variant, messages: record.messages.map(({ from, text, voice }) => ({ from, text, ...(voice ? { voice } : {}) }))
			}) });
			if (current !== generation || !alive) return;
			if (!response.ok) { review = response.status === 429 ? 'limit' : 'failed'; return; }
			const result = await response.json();
			if (current !== generation || !alive) return;
			const items: unknown[] = Array.isArray(result.upgrades) ? result.upgrades : [];
			const valid = items.filter((item): item is ChatUpgrade => {
				const value = item as Record<string, any>;
				return typeof value?.original === 'string' && typeof value.better === 'string' && typeof value.why?.en === 'string' && typeof value.why?.fa === 'string';
			}).map(({ original, better, why, kind }) => ({ original, better, why: { en: why.en, fa: why.fa }, ...(typeof kind === 'string' ? { kind } : {}) }));
			record = { ...record, review: valid }; persist();
			review = 'ready';
		} catch {
			if (current === generation) review = 'failed';
		}
	}

	function toResult() { stopAllAudio(); recording?.cancel(); go('result'); }
	function finish() { stopAllAudio(); onDone({ correct: record.goals.length, total: IDS.length }, $state.snapshot(record)); }
	function nextRewrite() { if (rewrite < upgrades.length - 1) { rewrite += 1; go('rewrite'); } else finish(); }
	const toggleText = (index: number) => (openText = { ...openText, [index]: !openText[index] });
</script>

{#snippet goalList()}
	<ul class="goals">
		{#each scene.goals as goal}
			{@const met = record.goals.includes(goal.id)}
			{@const again = reopened === goal.id}
			<li class:met><span class="mark" aria-hidden="true">{met ? '✓' : again ? '↺' : '○'}</span><span>{text(goal.label)}{#if met}<span class="sr-only">{T(' (done)', ' (انجام شد)')}</span>{:else if again}<span class="sr-only">{T(' (open again: plans changed)', ' (دوباره باز شد: برنامه عوض شد)')}</span>{/if}</span></li>
		{/each}
	</ul>
{/snippet}

<section class="group-chat" dir={isFa ? 'rtl' : 'ltr'}>
	{#if stage === 'situation'}
		<h2 class="title" tabindex="-1" bind:this={heading}><span aria-hidden="true">{scene.group.emoji}</span> <span lang="en" dir="ltr">{scene.group.name}</span></h2>
		<p class="lead">{#if isFa}<MixedText text={scene.screen.situation.fa} />{:else}{scene.screen.situation.en}{/if}</p>
		<p class="label">{text(scene.screen.goalsHeading)}</p>
		{@render goalList()}
		<p class="small">{T('Maya and Leo are played by AI: each message goes to an AI provider with the chat so far.', 'نقش مایا و لئو را هوش مصنوعی بازی می‌کند: هر پیامت همراه با چت قبلی به ارائه‌دهندهٔ هوش مصنوعی فرستاده می‌شود.')}</p>
		<ActionBar label={scene.screen.start ? text(scene.screen.start) : T('Open the chat', 'باز کردن چت')} onclick={() => open()}
			secondary={onSkip ? { label: T('Skip this step', 'این مرحله را رد کن'), onclick: () => { stopAllAudio(); onSkip?.(); } } : null} />

	{:else if stage === 'chat'}
		<header class="bar-top" dir="ltr">
			<span class="group-avatar" aria-hidden="true">{scene.group.emoji}</span>
			<div class="group-name"><h2 tabindex="-1" bind:this={heading} lang="en">{scene.group.name}</h2><small lang="en">{MEMBERS}</small></div>
			<button type="button" class="chip" onclick={() => sheet?.showModal()} dir={isFa ? 'rtl' : 'ltr'}>
				{T(`Goals · ${record.goals.length} of ${IDS.length}`, `هدف‌ها: ${N(record.goals.length)} از ${N(IDS.length)}`)}{#if reopened}<span aria-hidden="true">&nbsp;↺</span>{/if}
			</button>
		</header>
		<dialog class="sheet" bind:this={sheet} dir={isFa ? 'rtl' : 'ltr'} aria-labelledby="chat-goals-title" onclick={e => { if (e.target === sheet) sheet?.close(); }}>
			<div class="sheet-body">
				<h3 id="chat-goals-title">{text(scene.screen.goalsHeading)}</h3>
				{@render goalList()}
				<button type="button" class="close" onclick={() => sheet?.close()}>{T('Close', 'بستن')}</button>
			</div>
		</dialog>

		<div class="log" role="log" aria-live="polite" aria-relevant="additions" dir="ltr">
			{#each record.messages.slice(0, shown) as message, index (index)}
				{@const member = memberOf(scene, message.from)}
				{#if message.from === LEARNER}
					<div class="bubble you" aria-label={message.voice ? T(`You, voice note: ${message.text}`, `تو، پیام صوتی: ${message.text}`) : undefined}>
						{#if message.voice}<p class="voice-line" aria-hidden="true"><span class="mic-dot">🎤</span> <span class="wave"></span> {clock(noteSeconds(message))}</p>{/if}
						<p lang="en" class:transcript={message.voice}>{message.text}</p>
					</div>
				{:else}
					<div class="bubble friend">
						<small class="name {member?.color ?? ''}">{member?.name ?? message.from}</small>
						{#if message.voice}
							<div class="voice-line">
								<button type="button" class="play" aria-label={playing === index ? T(`Stop ${member?.name}'s voice note`, 'توقف پیام صوتی') : T(`Play ${member?.name}'s voice note, ${noteSeconds(message)} seconds`, `پخش پیام صوتی ${member?.name}، ${N(noteSeconds(message))} ثانیه`)} onclick={() => void play(index)}>{playing === index ? '■' : '▶'}</button>
								<span class="wave" aria-hidden="true"></span><span class="secs" aria-hidden="true">{clock(noteSeconds(message))}</span>
							</div>
							<button type="button" class="show" aria-expanded={!!openText[index]} onclick={() => toggleText(index)} dir={isFa ? 'rtl' : 'ltr'}>{openText[index] ? T('Hide text', 'پنهان کردن متن') : T('Show text', 'نمایش متن')}</button>
							{#if openText[index]}<p lang="en">{message.text}</p>{:else}<span class="sr-only" lang="en">{message.text}</span>{/if}
						{:else}
							<p lang="en">{message.text}</p>
						{/if}
					</div>
				{/if}
			{/each}
			{#if typingFrom}<p class="typing" aria-hidden="true"><span lang="en">{nameOf(typingFrom)}</span> {T('is typing', 'دارد می‌نویسد')}<span class="dots"><i></i><i></i><i></i></span></p>{/if}
		</div>

		{#if problem}<p class="note" role="alert">{text(problem)}</p>{/if}
		{#if closed}
			<p class="note good" role="status">{record.done ? T('Everything’s agreed. 🎉', 'همه‌چیز هماهنگ شد. 🎉') : T('That’s the end of the chat.', 'چت تمام شد.')}</p>
		{:else if composer === 'preview'}
			<div class="preview" role="status">
				<p class="small">{T('Check the words we heard:', 'کلماتی را که شنیدیم چک کن:')}</p>
				<p class="heard" lang="en" dir="ltr">“{heard}”</p>
			</div>
		{:else if composer === 'typing'}
			<label class="sr-only" for="chat-message">{T('Your message in English', 'پیامت به انگلیسی')}</label>
			<textarea id="chat-message" bind:this={input} bind:value={draft} lang="en" dir="ltr" rows="2" maxlength={CHARS} disabled={sending}
				placeholder={T('Type a message…', 'یک پیام بنویس…')}
				onkeydown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); void send(false); } }}></textarea>
		{/if}
		<div class="end" bind:this={bottom}></div>
		{#if newBelow && !closed}<button type="button" class="pill" onclick={() => scrollDown(true)}>{T('New message ↓', 'پیام تازه ↓')}</button>{/if}

		{#if closed}
			<ActionBar label={T('See how you did', 'دیدن نتیجه')} onclick={toResult} />
		{:else if composer === 'preview'}
			<ActionBar label={sending ? T('Sending…', 'در حال ارسال…') : T('Send', 'ارسال')} icon="send" disabled={sending} onclick={() => void send(true)}
				secondary={{ label: T('Record again', 'دوباره ضبط کن'), onclick: () => { heard = ''; composer = 'voice'; } }} />
		{:else if composer === 'typing'}
			<ActionBar label={sending ? T('Sending…', 'در حال ارسال…') : T('Send', 'ارسال')} icon="send" disabled={!draft.trim() || sending || record.settled} onclick={() => void send(false)}
				secondary={canRecord() ? { label: T('Use the mic', 'با میکروفون بگو'), onclick: toVoice } : problem && onSkip ? { label: T('Skip this step', 'این مرحله را رد کن'), onclick: () => { stopAllAudio(); onSkip?.(); } } : null} />
		{:else}
			<ActionBar
				label={composer === 'recording' ? T('Listening… tap to stop', 'گوش می‌دهم… بزن تا تمام شود') : composer === 'transcribing' ? T('One moment…', 'یک لحظه…') : T('Record a voice note', 'پیام صوتی بفرست')}
				icon={composer === 'recording' ? 'stop' : composer === 'transcribing' ? null : 'mic'} recording={composer === 'recording'}
				disabled={composer === 'transcribing' || sending || record.settled} onclick={() => void record_()}
				secondary={composer === 'voice' ? { label: T('Can’t talk now? Type', 'الان نمی‌توانی حرف بزنی؟ بنویس'), onclick: toTyping } : null} />
		{/if}

	{:else if stage === 'result'}
		<h2 class="title" tabindex="-1" bind:this={heading}>{record.done ? T('Done.', 'انجام شد.') : T(`You reached ${record.goals.length} of ${IDS.length} goals.`, `به ${N(record.goals.length)} هدف از ${N(IDS.length)} رسیدی.`)}</h2>
		{#if record.done}<p class="lead">{text(scene.screen.resultLead)}</p>{/if}
		{#if note}<p class="mira-note">{#if isFa}<MixedText text={note.fa} />{:else}{note.en}{/if}</p>{/if}
		{#if review === 'ready' && !upgrades.length}<p class="small">{T('Your messages already sounded natural.', 'پیام‌هایت همین حالا هم طبیعی بودند.')}</p>
		{:else if review === 'limit'}<p class="small">{T('Today’s AI allowance is used up, so the review of your messages isn’t available until tomorrow.', 'سهمیهٔ امروز هوش مصنوعی تمام شده است؛ بررسی پیام‌هایت فردا در دسترس است.')}</p>
		{:else if review === 'failed'}<p class="small">{T('The review of your messages couldn’t load.', 'بررسی پیام‌هایت انجام نشد.')}</p>{/if}
		{#if review === 'ready' && upgrades.length}
			<ActionBar label={upgrades.length === 1 ? T('See one of your messages', 'یکی از پیام‌هایت را ببین') : T(`See ${upgrades.length} of your messages`, `${N(upgrades.length)} پیامت را ببین`)} onclick={() => { rewrite = 0; go('rewrite'); }} />
		{:else if review === 'loading' || review === 'idle'}
			<ActionBar label={T('Looking at your messages…', 'در حال بررسی پیام‌هایت…')} disabled onclick={() => {}} secondary={{ label: T('Skip', 'رد شو'), onclick: finish }} />
		{:else}
			<ActionBar label={T('Continue', 'ادامه')} onclick={finish}
				secondary={review === 'failed' ? { label: T('Try the review again', 'دوباره بررسی کن'), onclick: () => void loadReview() } : { label: T('Chat again, with a change', 'یک بار دیگر، با تغییری کوچک'), onclick: () => open(other) }} />
		{/if}

	{:else}
		{@const upgrade = upgrades[rewrite]}
		<h2 class="title" tabindex="-1" bind:this={heading}>{T('Your message, a bit better', 'پیامت، کمی بهتر')}{#if upgrades.length > 1}<small class="count">&nbsp;· {N(rewrite + 1)}/{N(upgrades.length)}</small>{/if}</h2>
		{#if upgrade}
			<p class="label">{T('You said', 'تو گفتی')}</p>
			<p class="said" lang="en" dir="ltr">{upgrade.original}</p>
			<p class="label">{T('Friends would say', 'دوستان این‌طور می‌گویند')}</p>
			<p class="better" lang="en" dir="ltr">{upgrade.better}</p>
			<p class="why">{#if isFa}<MixedText text={upgrade.why.fa} />{:else}{upgrade.why.en}{/if}</p>
			{#key rewrite}<SayAgain sentence={upgrade.better} {isFa} />{/key}
		{/if}
		<ActionBar label={rewrite < upgrades.length - 1 ? T('Next', 'بعدی') : T('Continue', 'ادامه')} onclick={nextRewrite} />
	{/if}
</section>

<style>
	.group-chat { display: grid; gap: 12px; padding-block-end: 150px; }
	.title { margin: 0; font-family: var(--font-display); font-size: 1.4rem; line-height: 1.3; }
	.title:focus, .group-name h2:focus { outline: none; }
	.count { font-size: .9rem; color: var(--ink-soft); font-family: inherit; }
	.lead { margin: 0; line-height: 1.6; }
	.label { margin: 8px 0 0; font-size: .8rem; font-weight: 700; color: var(--accent-deep); }
	.small { margin: 0; font-size: .82rem; color: var(--ink-soft); line-height: 1.55; }
	.goals { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.goals li { display: flex; gap: 10px; line-height: 1.5; }
	.mark { flex: none; inline-size: 1.2em; color: var(--ink-soft); font-weight: 700; }
	.met .mark { color: var(--accent-deep); }
	.met { color: var(--ink-soft); }

	/* The chat header: one row (the group, its members, the goals chip). */
	.bar-top { position: sticky; inset-block-start: 0; z-index: 10; display: flex; align-items: center; gap: 10px; min-block-size: 56px; padding: 6px 0; background: var(--paper); border-block-end: 1px solid var(--line); }
	.group-avatar { display: grid; place-items: center; flex: none; inline-size: 40px; block-size: 40px; border-radius: 50%; background: var(--accent-wash); font-size: 1.3rem; }
	.group-name { flex: 1; min-inline-size: 0; display: grid; }
	.group-name h2 { margin: 0; font-size: 1rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.group-name small { color: var(--ink-soft); font-size: .78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.chip { flex: none; min-block-size: 44px; padding: 6px 12px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper-raised); color: var(--ink); font: inherit; font-size: .82rem; font-weight: 600; cursor: pointer; }

	.sheet { margin: auto auto 0; inline-size: 100%; max-inline-size: 680px; padding: 0; border: 0; border-radius: 18px 18px 0 0; background: var(--paper-raised); color: var(--ink); }
	.sheet::backdrop { background: rgba(0, 0, 0, .4); }
	.sheet-body { display: grid; gap: 12px; padding: 20px 20px calc(20px + env(safe-area-inset-bottom)); }
	.sheet h3 { margin: 0; font-size: 1.05rem; }
	.close { min-block-size: 48px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper); color: var(--ink); font: inherit; font-weight: 600; cursor: pointer; }

	.log { display: flex; flex-direction: column; gap: 8px; padding: 12px 10px; border-radius: 14px; background: var(--paper-sunken); min-block-size: 40vh; }
	.bubble { inline-size: fit-content; max-inline-size: 84%; padding: 8px 12px; border-radius: 14px 14px 14px 4px; background: var(--paper-raised); border: 1px solid var(--line); }
	.bubble.you { align-self: flex-end; border-radius: 14px 14px 4px 14px; background: var(--accent-wash); }
	.bubble p { margin: 0; line-height: 1.5; overflow-wrap: anywhere; }
	.bubble .transcript { margin-block-start: 4px; }
	/* New messages stop above the bottom bar, not behind it. */
	.end { scroll-margin-block-end: 170px; }
	.name { display: block; margin-block-end: 2px; font-size: .78rem; font-weight: 700; }
	/* Name colours: 4.5:1 or more on the bubble in both themes. */
	.name.violet { color: #6b3fa0; }
	.name.orange { color: #a3480a; }
	.name.blue { color: #1f5fa8; }
	:global([data-theme='dark']) .name.violet { color: #cdb2ff; }
	:global([data-theme='dark']) .name.orange { color: #ffb37a; }
	:global([data-theme='dark']) .name.blue { color: #9cc7ff; }
	.voice-line { display: flex; align-items: center; gap: 8px; margin: 0; font-size: .82rem; color: var(--ink-soft); }
	.play { display: grid; place-items: center; flex: none; inline-size: 44px; block-size: 44px; border: 0; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-size: 1rem; cursor: pointer; }
	.wave { flex: 1; min-inline-size: 80px; block-size: 14px; background: repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 5px); opacity: .45; border-radius: 2px; }
	.show { min-block-size: 44px; padding: 4px 0; border: 0; background: none; color: var(--accent-deep); font: inherit; font-size: .82rem; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.typing { margin: 0; font-size: .82rem; font-style: italic; color: var(--ink-soft); }
	.dots { display: inline-flex; gap: 3px; margin-inline-start: 4px; }
	.dots i { inline-size: 5px; block-size: 5px; border-radius: 50%; background: currentColor; animation: blink 1.2s infinite ease-in-out; }
	.dots i:nth-child(2) { animation-delay: .2s; }
	.dots i:nth-child(3) { animation-delay: .4s; }
	@keyframes blink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
	@media (prefers-reduced-motion: reduce) { .dots i { animation: none; opacity: .6; } }

	.preview { display: grid; gap: 4px; padding: 10px 12px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); }
	.heard { margin: 0; font-size: 1.05rem; line-height: 1.5; }
	.note { margin: 0; padding: 10px 12px; border-radius: 10px; background: var(--attention-wash); color: var(--attention); font-size: .88rem; line-height: 1.55; }
	.note.good { background: var(--accent-wash); color: var(--accent-deep); }
	textarea { inline-size: 100%; resize: vertical; min-height: 64px; padding: 10px 12px; border: 1px solid var(--control-border); border-radius: 10px; background: var(--paper); color: var(--ink); font: inherit; }
	.pill { position: fixed; inset-block-end: 130px; inset-inline-start: 50%; transform: translateX(-50%); z-index: 15; min-block-size: 44px; padding: 8px 16px; border: 0; border-radius: 999px; background: var(--ink); color: var(--paper); font: inherit; font-size: .85rem; font-weight: 600; cursor: pointer; }

	.mira-note { margin: 8px 0 12px; padding: 12px 14px; border-radius: 14px; background: var(--paper-raised); border-inline-start: 4px solid var(--accent); line-height: 1.6; }
	.said { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.better { margin: 0; font-family: var(--font-display); font-size: 1.25rem; line-height: 1.4; color: var(--accent-deep); }
	.why { margin: 0; color: var(--ink-soft); font-size: .92rem; line-height: 1.55; }
	button:focus-visible, textarea:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
