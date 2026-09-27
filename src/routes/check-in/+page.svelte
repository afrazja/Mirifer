<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import AppHeader from '$lib/components/AppHeader.svelte';
  import { invalidateAll } from '$app/navigation';
  import { preferencesStore } from '$stores/preferences';
  import type { PageData } from './$types';
  import type { Assessment } from '$lib/analytics/phase-three';
  let { data }: { data: PageData } = $props();
  const fa = $derived($preferencesStore.language === 'fa');
  const tr = (en: string, persian: string) => fa ? persian : en;
  type Item = { skill: 'listening' | 'reading'; question: string; questionFa: string; options: string[]; text: string | null; audio: string | null };
  let attempt = $state<Assessment | null>(null), result = $state<Assessment | null>(null);
  let items = $state<Item[]>([]), answers = $state<(number | null)[]>([]);
  let index = $state(0), selected = $state<number | null>(null), busy = $state(false), error = $state('');
  let playing = $state(false), audioFailed = $state(false), heard = $state(false);
  let audio: HTMLAudioElement | null = null;
  const current = $derived(items[index]);
  const date = (value: string) => new Date(value).toLocaleDateString(fa ? 'fa-IR' : 'en-GB');
  const stage = (day: number) => day === 0 ? tr('Baseline', 'سنجش آغازین') : tr(`Day ${day} check`, `سنجش روز ${day}`);
  function stopAudio() { if (audio) { audio.pause(); audio.src = ''; audio = null; } playing = false; }
  onDestroy(stopAudio);
  async function request(body: object) {
    const response = await fetch('/api/assessment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok) throw new Error(fa ? 'ذخیره یا دریافت سنجش انجام نشد. همین صفحه را باز نگه دارید و دوباره تلاش کنید.' : payload.error);
    return payload;
  }
  async function start() {
    busy = true; error = '';
    try {
      const payload = await request({ action: 'start' });
      if (payload.attempt.completed_at) { result = payload.attempt; await invalidateAll(); return; }
      attempt = payload.attempt; items = payload.items; index = 0; answers = []; selected = null;
      heard = false; audioFailed = false;
      await tick(); document.getElementById('check-question')?.focus();
    } catch (e) { error = (e as Error).message; } finally { busy = false; }
  }
  async function play() {
    if (!current?.audio || playing) return;
    stopAudio(); audioFailed = false; playing = true;
    const player = new Audio(current.audio); audio = player;
    const timeout = setTimeout(() => { if (audio === player && playing) { audioFailed = true; stopAudio(); } }, 20_000);
    player.onended = () => { clearTimeout(timeout); if (audio === player) { heard = true; playing = false; } };
    player.onerror = () => { clearTimeout(timeout); if (audio === player) { audioFailed = true; playing = false; } };
    try { await player.play(); } catch { clearTimeout(timeout); if (audio === player) { audioFailed = true; playing = false; } }
  }
  async function save() {
    if (!attempt) return;
    busy = true; error = '';
    try { const payload = await request({ action: 'finish', id: attempt.id, answers }); result = payload.result; await invalidateAll(); }
    catch (e) { error = (e as Error).message; } finally { busy = false; }
  }
  async function next(skip = false) {
    stopAudio(); answers = [...answers, skip ? null : selected];
    if (index === items.length - 1) { await save(); return; }
    index++; selected = null; heard = false; audioFailed = false;
    await tick(); document.getElementById('check-question')?.focus();
  }
</script>

<svelte:head><title>German progress check · Mirifer</title><meta name="robots" content="noindex" /></svelte:head>
<main id="main-content" class="check-page" dir={fa ? 'rtl' : 'ltr'}>
  <AppHeader backHref="/home" backLabel={tr('Back to learning', 'بازگشت به یادگیری')} direction={fa ? 'rtl' : 'ltr'} />
  <header><span class="eyebrow">MIRIFER / {tr('PROGRESS CHECK', 'سنجش پیشرفت')}</span><h1>{tr('See what you understand.', 'ببین چه چیزهایی را می‌فهمی.')}</h1></header>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  {#if data.unavailable}
    <section class="card"><h2>{tr('Checks are temporarily unavailable', 'سنجش فعلاً در دسترس نیست')}</h2><p>{tr('Your lessons are still available. Please try this page again later.', 'درس‌ها همچنان در دسترس‌اند. کمی بعد دوباره به این صفحه برگرد.')}</p><a href="/home">{tr('Continue learning', 'ادامه یادگیری')}</a></section>
  {:else if result}
    <section class="card" aria-live="polite"><span class="eyebrow">{tr('RESULT SAVED', 'نتیجه ذخیره شد')}</span><h2>{stage(result.checkpoint)}</h2>
      <div class="scores"><div><b>{result.listening_correct} / 6</b><span>{tr('Listening', 'شنیداری')}</span></div><div><b>{result.reading_correct} / 6</b><span>{tr('Reading', 'خواندن')}</span></div></div>
      <p>{tr(`Skipped questions: ${result.skipped}. Skips count as incorrect for this check.`, `${result.skipped} سؤال رد شد. این سؤال‌ها در این سنجش نادرست شمرده می‌شوند.`)}</p>
      <p>{tr('This is a small practice check, not a CEFR level or a percentage of German learned. Keep practising; your next check uses an alternate set of questions.', 'این یک سنجش تمرینی کوتاه است، نه سطح CEFR یا درصد زبان آلمانی که آموخته‌ای. تمرین را ادامه بده؛ سنجش بعدی مجموعه سؤال دیگری دارد.')}</p>
      {#if data.schedule?.nextAt}<p>{tr('Next check opens: ', 'سنجش بعدی از این تاریخ باز می‌شود: ')}<b>{date(data.schedule.nextAt)}</b></p>{/if}
      <a class="primary" href="/lesson">{tr('Continue with a lesson', 'ادامه با یک درس')}</a>
    </section>
  {:else if attempt && current}
    <section class="card">
      <div class="question-meta"><span>{stage(attempt.checkpoint)}</span><span>{index + 1} / {items.length}</span></div>
      <progress value={index} max={items.length} aria-label={tr('Check progress', 'پیشرفت سنجش')}></progress>
      {#if answers.length === items.length}
        <h2>{tr('Your answers are ready to save.', 'پاسخ‌ها آماده ذخیره هستند.')}</h2><p>{tr('Keep this page open until you see “Result saved”.', 'صفحه را باز نگه دار تا پیام «نتیجه ذخیره شد» نمایش داده شود.')}</p><button class="primary" disabled={busy} onclick={save}>{tr('Retry saving result', 'تلاش دوباره برای ذخیره')}</button>
      {:else}
        <span class="eyebrow">{current.skill === 'listening' ? tr('LISTENING', 'شنیداری') : tr('READING', 'خواندن')}</span>
        {#if current.audio}
          <button class="audio" onclick={play} disabled={playing}>{playing ? tr('Playing…', 'در حال پخش…') : heard ? tr('Listen again', 'دوباره گوش بده') : tr('Play audio', 'پخش صدا')}</button>
          {#if audioFailed}<p role="alert" class="error">{tr('Audio did not play. Retry, or return later. An audio failure should not become a wrong answer.', 'صدا پخش نشد. دوباره تلاش کن یا بعداً برگرد. مشکل صدا نباید پاسخ نادرست محسوب شود.')}</p>{/if}
          {#if !heard}<p class="small">{tr('Listen to the full recording before answering. You can replay it.', 'پیش از پاسخ، به تمام صدا گوش بده. می‌توانی دوباره آن را پخش کنی.')}</p>{/if}
        {:else}<p class="reading" lang="de" dir="ltr">{current.text}</p>{/if}
        <h2 id="check-question" tabindex="-1">{fa ? current.questionFa : current.question}</h2>
        <fieldset disabled={busy || (current.skill === 'listening' && !heard)}><legend class="small">{tr('Choose one answer', 'یک پاسخ انتخاب کن')}</legend>
          {#each current.options as option, i}<label class:selected={selected === i}><input type="radio" name="answer" value={i} bind:group={selected} /><span lang="de" dir="ltr">{option}</span></label>{/each}
        </fieldset>
        <div class="actions"><button class="primary" onclick={() => next()} disabled={busy || selected === null || (current.skill === 'listening' && !heard)}>{index === 11 ? tr('Save my result', 'ذخیره نتیجه') : tr('Next question', 'سؤال بعدی')}</button><button class="skip" onclick={() => next(true)} disabled={busy || (current.skill === 'listening' && !heard)}>{tr('I don’t know — skip', 'نمی‌دانم — رد کردن')}</button></div>
      {/if}
    </section>
  {:else}
    <section class="card"><span class="eyebrow">{tr('A SMALL CHECK, OVER TIME', 'یک سنجش کوتاه در طول زمان')}</span><h2>{data.schedule?.due === 0 ? tr('Start with your baseline.', 'با سنجش آغازین شروع کن.') : tr('Check your progress.', 'پیشرفتت را بسنج.')}</h2>
      <p>{tr('12 questions: six listening and six reading. Allow about 5–8 minutes. Use headphones if you can. Work without a translator, hints or outside help; skip anything you do not know.', '۱۲ سؤال: شش شنیداری و شش خواندن. حدود ۵ تا ۸ دقیقه وقت بگذار. اگر ممکن است از هدفون استفاده کن. بدون مترجم، راهنما یا کمک دیگران پاسخ بده و هرچه نمی‌دانی رد کن.')}</p>
      <p>{tr('We save section scores and dates, not recordings or answer text. There is one saved result per checkpoint. Follow-ups open 14, 30, 90 and 180 days after your baseline; the first two remain open for 16 and 30 days, and the later two for 30 days.', 'نمره هر بخش و تاریخ را ذخیره می‌کنیم، نه صدا یا متن پاسخ‌ها. برای هر مرحله فقط یک نتیجه ذخیره می‌شود. سنجش‌های بعدی ۱۴، ۳۰، ۹۰ و ۱۸۰ روز پس از سنجش آغازین باز می‌شوند؛ مرحله اول ۱۶ روز و بقیه ۳۰ روز باز می‌مانند.')}</p>
      <p class="small">{tr('These pilot question sets have not been calibrated to CEFR levels. They do not assess speaking or writing. Revisiting a question set and differences between sets may affect later scores.', 'این مجموعه سؤال‌های آزمایشی برای تعیین سطح CEFR استانداردسازی نشده‌اند و گفتار یا نوشتار را نمی‌سنجند. آشنایی با سؤال‌ها و تفاوت مجموعه‌ها می‌تواند روی نمره بعدی اثر بگذارد.')}</p>
      {#if data.schedule?.due !== null && data.schedule?.due !== undefined}<button class="primary" disabled={busy} onclick={start}>{busy ? tr('Opening…','در حال باز شدن…') : `${tr('Start ', 'شروع ')}${stage(data.schedule.due)}`}</button>
      {:else if data.schedule?.nextAt}<p class="next-date">{tr('Your next check opens on ', 'سنجش بعدی از این تاریخ باز می‌شود: ')}<b>{date(data.schedule.nextAt)}</b></p>
      {:else}<p>{tr('There are no further scheduled checks in this pilot.', 'در این دوره آزمایشی سنجش دیگری برنامه‌ریزی نشده است.')}</p>{/if}
    </section>
  {/if}
  {#if data.history.some(a => a.completed_at) && !attempt}
    <section class="card history"><h2>{tr('Your saved checks', 'سنجش‌های ذخیره‌شده')}</h2>{#each data.history.filter(a => a.completed_at) as entry}<div><span>{stage(entry.checkpoint)}<small>{date(entry.completed_at!)}</small></span><span>{tr('Listening', 'شنیداری')} {entry.listening_correct}/6 · {tr('Reading','خواندن')} {entry.reading_correct}/6</span></div>{/each}</section>
  {/if}
</main>
<style>
  .check-page { max-width:780px; margin:0 auto; padding:28px 22px 70px; color:var(--ink,#14201b); font-family:'IBM Plex Sans Variable','Vazirmatn Variable',sans-serif; }
  header .eyebrow { color:var(--ink-soft,#4d5b55); }
  header { margin:40px 0 25px; } .eyebrow { display:block; font-size:.7rem; letter-spacing:.09em; color:#9fc681; margin:16px 0; }
  h1 { font-family:'Newsreader Variable','Vazirmatn Variable',serif; font-size:clamp(2.2rem,5vw,3.5rem); font-weight:500; line-height:1.1; margin:18px 0; } h2 { font-size:1.35rem; line-height:1.5; font-weight:500; }
  .card { padding:30px; border:1px solid #3d5247; background:#17271f; color:#f0f3ed; border-radius:16px; margin:22px 0; } p { color:#bbc8bf; line-height:1.8; } .small,small { font-size:.82rem; color:#afbeb2; line-height:1.7; } small { display:block; }
  button,a.primary { font:inherit; cursor:pointer; min-height:46px; } button:disabled { opacity:.5; cursor:default; } button:focus-visible,a:focus-visible,input:focus-visible { outline:2px solid #b6dd94; outline-offset:4px; }
  .primary { display:inline-flex; justify-content:center; align-items:center; background:#b6dd94; color:#18231f; border:0; border-radius:8px; padding:12px 20px; text-decoration:none; font-weight:500; }
  .actions { display:flex; align-items:center; gap:20px; flex-wrap:wrap; margin-top:22px; } .skip { border:0; background:none; color:#c3d0c6; padding:10px 0; }
  .audio { width:100%; padding:18px; background:#273d2e; color:#dbeed0; border:1px solid #5a7650; border-radius:10px; margin:12px 0; }
  .reading { background:#21362a; padding:22px; border-radius:10px; font-size:1.15rem; } .question-meta { display:flex; justify-content:space-between; gap:16px; color:#b7c7bb; font-size:.85rem; }
  progress { width:100%; height:5px; accent-color:#b6dd94; margin:18px 0; } fieldset { border:0; padding:0; margin:20px 0; } legend { padding:0 0 8px; } label { display:flex; align-items:center; gap:12px; border:1px solid #3d5247; border-radius:9px; padding:16px; margin:10px 0; cursor:pointer; } label.selected { background:#2a412f; border-color:#b6dd94; } input { accent-color:#b6dd94; }
  .error { padding:14px 18px; border:1px solid #975d4d; background:#382722; color:#ffd0bf; border-radius:8px; } .scores { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin:30px 0; } .scores div { padding:22px; border:1px solid #3d5247; border-radius:10px; } .scores b { display:block; font-size:2rem; font-weight:400; margin-bottom:10px; } .scores span { color:#b7c7bb; }
  .history>div { display:flex; justify-content:space-between; gap:20px; padding:16px 0; border-bottom:1px solid #3d5247; font-size:.85rem; }
  @media(max-width:600px) { .check-page { padding:22px 14px 50px; } .card { padding:21px; } .scores { gap:10px; } .scores div { padding:15px; } .history>div { flex-direction:column; gap:8px; } }
</style>
