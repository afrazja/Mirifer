<script lang="ts">
 import { onMount } from 'svelte';
 import AppHeader from '$lib/components/AppHeader.svelte';
 import GermanSectionTabs from '$lib/components/GermanSectionTabs.svelte';
 import LearningPath from '$lib/components/LearningPath.svelte';
 import { getLessonIndex, resolveResumePoint, type LessonMeta } from '$services/lesson-loader';
 import { getLanguage, getProgress, getCompletedLessons } from '$services/data-layer';
 import type { Language } from '$stores/preferences';

 let language = $state<Language>('en');
 let lessons = $state<LessonMeta[]>([]);
 let completed = $state<Record<number, unknown>>({});
 let currentDay = $state(1);
 let loading = $state(true);
 let failed = $state(false);

 async function loadLessons() {
  loading = true;
  failed = false;
  try {
   const [index, history, progress, savedLanguage] = await Promise.all([
    getLessonIndex(), getCompletedLessons(), getProgress(), getLanguage()
   ]);
   lessons = index;
   completed = history;
   currentDay = resolveResumePoint(progress, history).day;
   language = savedLanguage === 'fa' ? 'fa' : 'en';
  } catch {
   failed = true;
  } finally {
   loading = false;
  }
 }
 onMount(() => { void loadLessons(); });
</script>

<svelte:head><title>{language === 'fa' ? 'همه درس‌ها' : 'All lessons'} – Mirifer</title></svelte:head>

<main id="main-content" dir={language === 'fa' ? 'rtl' : 'ltr'}>
 <AppHeader title={language === 'fa' ? 'همه درس‌ها' : 'All lessons'} backHref="/languages"
  backLabel={language === 'fa' ? 'زبان‌ها' : 'Languages'} direction={language === 'fa' ? 'rtl' : 'ltr'} />
 <GermanSectionTabs current="lessons" {language} />
 {#if failed}
  <div class="load-error" role="alert">
   <p>{language === 'fa' ? 'بارگذاری درس‌ها انجام نشد.' : 'We couldn’t load your lessons.'}</p>
   <button onclick={loadLessons}>{language === 'fa' ? 'تلاش دوباره' : 'Try again'}</button>
  </div>
 {:else}
  <LearningPath {lessons} {completed} {currentDay} {language} {loading} />
 {/if}
</main>

<style>
 main { max-width:1100px; margin:0 auto; padding:28px 24px 48px; display:flex; flex-direction:column; gap:24px; }
 .load-error { padding:24px; border:1px solid var(--line); border-radius:18px; background:var(--paper-raised); }
 button { padding:10px 16px; min-height:44px; border:1px solid var(--line); border-radius:var(--radius-control); background:var(--control); color:var(--ink); font:inherit; cursor:pointer; }
 @media(max-width:600px) { main { padding:20px 16px 32px; gap:20px; } }
</style>
