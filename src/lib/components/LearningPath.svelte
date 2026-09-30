<script lang="ts">
 import type { LessonMeta } from '$services/lesson-loader';
 let { lessons, completed = {}, currentDay = 1, language = 'en', loading = false }: {
  lessons: LessonMeta[]; completed?: Record<number, unknown>; currentDay?: number;
  language?: 'en' | 'fa'; loading?: boolean;
 } = $props();
 // Only lessons the learner has finished: nothing locked, no count of what remains.
 const passed = $derived([...lessons].filter(day => completed[day.day]).sort((a,b) => a.day-b.day));
 function title(meta: LessonMeta) {
  return (language === 'fa' && meta.titleFa ? meta.titleFa : meta.title).replace(/^(?:(?:Day|روز)\s*)?[0-9۰-۹٠-٩]+\s*[:.\-–]\s*/i, '');
 }
</script>
<section class="learning-path" id="learning-path" aria-labelledby="path-heading">
 <header>
  <div><span class="eyebrow">{language === 'fa' ? 'روز به روز' : 'DAY BY DAY'}</span>
   <h2 id="path-heading">{language === 'fa' ? 'درس‌های تمام‌شدهٔ تو' : 'Your completed lessons'}</h2>
   <p>{language === 'fa' ? 'هر درس تمام‌شده را دوباره تمرین کن.' : 'Revisit any lesson you’ve finished.'}</p>
  </div>
 </header>
 {#if loading}<p role="status">{language === 'fa' ? 'در حال بارگذاری درس‌ها…' : 'Loading lessons…'}</p>
 {:else if !lessons.length}<p role="status">{language === 'fa' ? 'درس‌ها بارگذاری نشدند. صفحه را تازه کن.' : 'Lessons couldn’t be loaded. Please refresh to try again.'}</p>
 {:else if !passed.length}
  <p role="status">{language === 'fa' ? 'هنوز درسی را تمام نکرده‌ای.' : 'You haven’t finished a lesson yet.'}</p>
  <a class="start" href={`/lesson?day=${currentDay}`}>{language === 'fa' ? `شروع روز ${currentDay} ←` : `Start Day ${currentDay} →`}</a>
 {:else}
  <div class="lesson-list" role="region" aria-label={language === 'fa' ? 'درس‌های تمام‌شده' : 'Completed lessons'}>
   <ol>
    {#each passed as meta (meta.day)}
     <li class="done">
      <a href={`/lesson?day=${meta.day}`}>
       <span class="day-number" aria-hidden="true">✓</span>
       <span class="lesson-copy"><span class="day-label">{language === 'fa' ? 'روز' : 'Day'} {meta.day}</span><strong>{title(meta)}</strong></span>
       <span class="state">{language === 'fa' ? 'تمرین دوباره ←' : 'Practice again →'}</span>
      </a>
     </li>
    {/each}
   </ol>
  </div>
 {/if}
</section>
<style>
 .learning-path { padding:28px; border:1px solid var(--line); border-radius:18px; background:var(--paper-raised); scroll-margin-top:24px; }
 header { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin-bottom:22px; }
 .eyebrow { color:var(--accent); font-size:.72rem; font-weight:700; letter-spacing:.12em; }
 h2 { margin:6px 0 8px; color:var(--ink); font-family:var(--font-display); font-size:1.6rem; }
 p { margin:0; color:var(--ink-soft); line-height:1.6; }
 .lesson-list { border-top:1px solid var(--line); }
 ol { list-style:none; padding:0; margin:0; }
 li { border-bottom:1px solid var(--line); }
 li:last-child { border-bottom:0; }
 .lesson-list a { display:flex; align-items:center; gap:16px; padding:16px 10px; min-height:84px; color:var(--ink); text-decoration:none; border-radius:8px; }
 .lesson-list a:hover { background:var(--control-hover); }
 .lesson-list a:focus-visible { outline:2px solid var(--accent); outline-offset:-2px; }
 .day-number { display:grid; place-items:center; flex-shrink:0; width:38px; height:38px; border:1px solid var(--line); border-radius:50%; font-size:.9rem; color:var(--ink-soft); }
 .done .day-number { background:var(--accent); color:var(--on-brand); border-color:var(--accent); }
 .lesson-copy { display:flex; flex:1; min-width:0; flex-direction:column; gap:4px; }
 .day-label { color:var(--ink-soft); font-size:.75rem; }
 strong { font-size:.98rem; font-weight:600; overflow-wrap:anywhere; }
 .start { display:inline-flex; align-items:center; min-height:44px; margin-top:14px; color:var(--accent); font-weight:600; }
 .state { font-size:.75rem; color:var(--accent); white-space:nowrap; }
 @media(max-width:600px) { .learning-path { padding:20px 16px; } header { flex-direction:column; gap:12px; } .lesson-list a { flex-wrap:wrap; gap:10px; padding:14px 4px; } .state { width:100%; padding-inline-start:48px; } h2 { font-size:1.4rem; } }
</style>
