<script lang="ts">
	/**
	 * Persian landing page.
	 *
	 * Not a translation of the English one. The English page sells "learn
	 * German through conversation" to anyone; this sells the thing only this
	 * app has for this audience — German explained in Persian, aimed at
	 * Goethe A1, with the sounds Persian speakers actually struggle with.
	 *
	 * A separate URL rather than a language toggle on `/`, because a toggle
	 * gives Google one page to index. Two URLs plus hreflang gives it two,
	 * and an Iranian searching «آموزش زبان آلمانی» is searching in Persian
	 * for a page that has to exist in Persian to be found at all.
	 *
	 * Why this page exists: 30 days of analytics show 192 visitors, 13 of
	 * them from Iran, and 10 from Google in total. The app converts badly
	 * AND nobody arrives; this is the second problem.
	 */
	import { onMount } from 'svelte';
	import * as auth from '$services/auth';

	let isAuthenticated = $state(false);

	onMount(async () => {
		try {
			isAuthenticated = await auth.isAuthenticated();
		} catch {
			// Signed out is the default and the common case.
		}
	});

	const faqs = [
		{
			q: 'آیا واقعاً رایگان است؟',
			a: 'در دورهٔ دسترسی اولیه، بله. همهٔ درس‌های روزانه، تمرین مکالمه و بخش دستور زبان رایگان است و کارت بانکی لازم نیست. اگر روزی قیمت‌گذاری تغییر کند، کاربران دسترسی اولیه مدت‌ها پیش از آن باخبر می‌شوند.'
		},
		{
			q: 'چرا برای فارسی‌زبانان ساخته شده؟',
			a: 'چون مشکل‌های ما با آلمانی مشخص است. صداهای ü و ö در فارسی وجود ندارند، «ich» به «ایش» تبدیل می‌شود، و فارسی اجازهٔ خوشهٔ همخوانی در ابتدای کلمه نمی‌دهد؛ برای همین «Stadt» را «اِستات» می‌گوییم. برنامه دقیقاً همین‌ها را تشخیص می‌دهد و می‌گوید چطور درستش کنی.'
		},
		{
			q: 'برای آزمون گوته A1 مناسب است؟',
			a: 'بله. برنامه بر اساس چهار بخش آزمون — شنیدن، خواندن، نوشتن و صحبت — پیش می‌رود و آمادگی‌ات را در هر بخش جداگانه تخمین می‌زند. شنیدن و صحبت از خود درس‌ها می‌آیند؛ خواندن و نوشتن از سؤال‌های مرور، جایی که معنی را انتخاب می‌کنی یا کلمهٔ جاافتاده را تایپ می‌کنی.'
		},
		{
			q: 'چقدر باید هر روز وقت بگذارم؟',
			a: 'روزی یک درس، به ترتیب. پانزده دقیقهٔ هر روز بیشتر از دو ساعت در آخر هفته اثر دارد. اگر روزی جا ماند، از همان‌جا ادامه بده — جریمه‌ای در کار نیست.'
		},
		{
			q: 'میکروفون لازم دارم؟',
			a: 'برای تمرین صحبت بله، ولی اجباری نیست. می‌توانی جواب‌ها را تایپ کنی و بقیهٔ درس بدون میکروفون کار می‌کند.'
		},
		{
			q: 'از صفر شروع می‌کنم، مشکلی نیست؟',
			a: 'اصلاً. درس اول با «سلام» و «صبح بخیر» شروع می‌شود.'
		}
	];
</script>

<svelte:head>
	<title>آموزش زبان آلمانی برای فارسی‌زبانان — آمادگی آزمون گوته A1 | میریفر</title>
	<meta
		name="description"
		content="آموزش رایگان زبان آلمانی با توضیح‌های فارسی. ۱۲۰ درس روزانه، تمرین مکالمه با صدا، و آمادگی آزمون Goethe-Zertifikat A1. از روز اول آلمانی حرف بزنید."
	/>
	<link rel="canonical" href="https://www.mirifer.com/fa" />
	<!-- Tells Google these are the same page in two languages, so neither is
	     treated as duplicate content and each is served to the right search. -->
	<link rel="alternate" hreflang="fa" href="https://www.mirifer.com/fa" />
	<link rel="alternate" hreflang="en" href="https://www.mirifer.com/" />
	<link rel="alternate" hreflang="x-default" href="https://www.mirifer.com/" />
	<meta property="og:title" content="آموزش زبان آلمانی برای فارسی‌زبانان | میریفر" />
	<meta
		property="og:description"
		content="۱۲۰ درس روزانه، توضیح‌ها به فارسی، تمرین تلفظ مخصوص فارسی‌زبانان، و آمادگی آزمون گوته A1. رایگان."
	/>
	<meta property="og:locale" content="fa_IR" />
	<meta property="og:url" content="https://www.mirifer.com/fa" />
</svelte:head>

<div class="fa-page" lang="fa" dir="rtl">
	<section class="hero">
		<!-- Ambient blobs, same treatment as the English hero. Purely
		     decorative, so aria-hidden and pointer-events:none. -->
		<div class="blob blob-1" aria-hidden="true"></div>
		<div class="blob blob-2" aria-hidden="true"></div>

		<div class="hero-content">
			<div class="badge">🇩🇪 آلمانی برای فارسی‌زبانان</div>
			<h1>
				آلمانی را طوری یاد بگیر<br />
				<span class="grad">که واقعاً حرف بزنی</span>
			</h1>
			<p class="sub">
				توضیح‌ها به فارسی. از روز اول صحبت می‌کنی، نه بعد از ماه‌ها گرامر.
			</p>
			<div class="actions">
				{#if isAuthenticated}
					<a class="btn primary" href="/home">رفتن به درس‌ها ←</a>
				{:else}
					<a class="btn primary" href="/try">🎙️ یک درس را همین حالا امتحان کن</a>
				{/if}
			</div>
			<p class="note">بدون کارت بانکی · بدون هزینه</p>
		</div>

		<!--
			App preview, built as markup rather than reusing the English
			page's phone-preview.jpg.

			That screenshot shows an English interface — the language
			selector literally reads "English", and the sentence is glossed
			"What is your favorite hobby?". Putting it here would contradict
			«توضیح‌ها به فارسی» in the paragraph directly above it, at the
			exact moment someone is deciding whether to believe the claim.

			Markup also beats the JPEG on its own terms: nothing to download
			on a slow mobile connection, sharp at any density, and it follows
			the theme instead of being a baked-in light-mode picture.
		-->
		<div class="hero-visual" aria-hidden="true">
			<div class="phone">
				<div class="phone-notch"></div>
				<div class="phone-screen">
					<div class="ph-top">
						<span class="ph-brand">میریفر</span>
						<span class="ph-day">روز ۳</span>
					</div>
					<div class="ph-progress"><span style="inline-size: 38%"></span></div>

					<div class="ph-card">
						<p class="ph-de" dir="ltr" lang="de">Was möchten Sie trinken?</p>
						<p class="ph-fa">چه چیزی میل دارید بنوشید؟</p>
						<div class="ph-btns">
							<span class="ph-btn ghost">🔊 دوباره</span>
							<span class="ph-btn solid">بعدی ←</span>
						</div>
					</div>

					<div class="ph-card said">
						<p class="ph-label">تو گفتی</p>
						<p class="ph-de" dir="ltr" lang="de">Ich möchte einen Kaffee.</p>
						<p class="ph-ok">✓ درست — تلفظ ö عالی بود</p>
					</div>

					<div class="ph-mic"><span>🎙️</span></div>
				</div>
			</div>
		</div>
	</section>


	<!-- The section that only this app can write. Everything above is
	     something any language app could claim. -->
	<section class="band">
		<p class="eyebrow">چرا این یکی فرق دارد</p>
		<h2>ساخته شده برای مشکل‌هایی که ما داریم</h2>
		<div class="grid">
			<div class="card">
				<h3>صداهایی که در فارسی نداریم</h3>
				<p>
					ü و ö در فارسی وجود ندارند و ما ناخودآگاه آن‌ها را «او» و «اُ»
					می‌گوییم — ولی در آلمانی <span lang="de">schon</span> و
					<span lang="de">schön</span> دو کلمهٔ متفاوت‌اند. وقتی این اتفاق
					بیفتد، برنامه دقیقاً همان صدا را نام می‌برد و می‌گوید چطور
					درستش کنی.
				</p>
			</div>
			<div class="card">
				<h3>خوشهٔ همخوانی در ابتدای کلمه</h3>
				<p>
					فارسی اجازه نمی‌دهد کلمه با دو همخوان شروع شود، برای همین
					<span lang="de">Stadt</span> را «اِستات» و
					<span lang="de">sprechen</span> را «سِپرشن» می‌گوییم. این هم
					تشخیص داده می‌شود.
				</p>
			</div>
			<div class="card">
				<h3>توضیح‌ها به فارسی، نه انگلیسی</h3>
				<p>
					قاعده‌های دستوری، راهنماها و ترجمه‌ها همه فارسی‌اند. لازم
					نیست اول انگلیسی بلد باشی تا آلمانی یاد بگیری.
				</p>
			</div>
			<div class="card">
				<h3>یک چیز که از قبل بلدی</h3>
				<p>
					صدای «خ» در <span lang="de">Bach</span> برای انگلیسی‌زبان‌ها
					سخت‌ترین صدای آلمانی است. تو از قبل آن را داری. بعضی چیزها
					برای ما آسان‌تر است.
				</p>
			</div>
		</div>
	</section>

	<!-- Philosophy. Deliberately framed as method rather than audience fit,
	     so it does not repeat the Persian-specific section above it. Each
	     principle names a real product constraint — the sentence cap, the
	     day-one speaking, the error diagnosis — so it reads as decisions
	     already made rather than as marketing. -->
	<section class="band alt">
		<p class="eyebrow">فلسفهٔ ما</p>
		<h2>چهار اصلی که این برنامه رویش ساخته شده</h2>
		<p class="lead">هرکدام از این‌ها تصمیمی است دربارهٔ چیزی که عمداً نگذاشته‌ایم.</p>
		<div class="grid">
			<div class="card">
				<h3>جمله یاد می‌گیری، نه کلمه</h3>
				<p>
					فهرست لغت به تو کلمه‌هایی می‌دهد که نمی‌توانی به کار ببری.
					اینجا هر درس جملهٔ کامل است، چون کوچک‌ترین چیزی که واقعاً
					می‌شود به کسی گفت یک جمله است. یاد می‌گیری
					<span lang="de">Ich hätte gern einen Kaffee</span> — نه «قهوه».
				</p>
			</div>
			<div class="card">
				<h3>تمرین منظم کمک می‌کند جلو بروی</h3>
				<p>
					هر درس را با سرعت خودت پیش ببر. هر جا لازم بود دوباره گوش کن،
					جمله‌ها را تمرین کن و وقتی آماده بودی ادامه بده.
				</p>
			</div>
			<div class="card">
				<h3>از درس اول حرف می‌زنی</h3>
				<p>
					نه بعد از شش ماه جدول گرامر. روز اول یک جملهٔ آلمانی بلند
					می‌گویی و برنامه می‌گوید چه چیزی شنیده — چون فاصلهٔ بین آن دو
					همان جایی است که یادگیری اتفاق می‌افتد.
				</p>
			</div>
			<div class="card">
				<h3>اشتباهِ بلند، بهتر از درستِ توی ذهن</h3>
				<p>
					خواندن در سکوت حس پیشرفت می‌دهد و چیزی نمی‌سازد که در نانوایی
					به کارت بیاید. این برنامه ساخته شده که اشتباه‌هایت را بشنود و
					اسم ببرد — و این فقط وقتی کار می‌کند که اشتباه کنی.
				</p>
			</div>
		</div>
	</section>

	<section class="band">
		<p class="eyebrow">چطور استفاده کنی</p>
		<h2>چهار قانون که کار را جلو می‌برد</h2>
		<ol class="rules">
			<li>
				<strong>روزی یک درس. همین.</strong>
				اگر می‌توانی هر روز سر یک ساعت. نه پنج درس در جمعه و هیچ‌چیز تا
				جمعهٔ بعد.
			</li>
			<li>
				<strong>هر جمله را بلند بگو.</strong>
				حتی وقتی تنهایی. حتی وقتی عجیب به نظر می‌رسد — مخصوصاً وقتی عجیب
				به نظر می‌رسد.
			</li>
			<li>
				<strong>برای نمرهٔ کامل درس را از اول شروع نکن.</strong>
				اشتباه کردن و اصلاح شدن، خودِ درس است. رد شو و برو جلو.
			</li>
			<li>
				<strong>فردا برگرد.</strong>
				کل روش همین است. بقیه‌اش جزئیات است.
			</li>
		</ol>
	</section>

	<section class="band alt">
		<p class="eyebrow">آزمون گوته</p>
		<h2>آمادگی Goethe-Zertifikat A1</h2>
		<p class="lead">
			برنامه بر اساس چهار بخش آزمون پیش می‌رود — شنیدن، خواندن، نوشتن و
			صحبت — و آمادگی‌ات را در هر بخش جداگانه نشان می‌دهد.
		</p>
		<div class="skills">
			<span>شنیدن</span><span>خواندن</span><span>نوشتن</span><span>صحبت</span>
		</div>
	</section>

	<section class="band">
		<p class="eyebrow">سؤال‌های رایج</p>
		<h2>چیزهایی که معمولاً می‌پرسند</h2>
		<div class="faq">
			{#each faqs as f (f.q)}
				<details>
					<summary>{f.q}</summary>
					<p>{f.a}</p>
				</details>
			{/each}
		</div>
	</section>

	<section class="band cta">
		<h2>اولین درس، همین حالا</h2>
		<p class="lead">سه جمله. بدون ثبت‌نام. ببین چطور است.</p>
		<div class="actions">
			<a class="btn primary" href="/try">🎙️ شروع کن</a>
			<a class="btn ghost" href="/login">ساخت حساب رایگان</a>
		</div>
		<p class="switch"><a href="/">English version</a></p>
	</section>
</div>

<style>
	.fa-page {
		font-family: var(--font-body);
		color: var(--ink);
		background: var(--paper);
	}

	section {
		max-width: 900px;
		margin: 0 auto;
		padding: 56px 20px;
		text-align: center;
	}

	.hero {
		position: relative;
		max-width: 1100px;
		padding-block: 72px 40px;
		display: grid;
		grid-template-columns: 1fr;
		gap: 44px;
		align-items: center;
		/* The blobs overhang the edges; without this they widen the document
		   and the whole page scrolls sideways on a phone. */
		overflow: hidden;
	}

	/* Two columns once there is room. In RTL the first grid item lands on
	   the right on its own — no ordering needed. */
	@media (min-width: 900px) {
		.hero {
			grid-template-columns: 1.05fr 0.95fr;
			gap: 32px;
			padding-block: 88px 56px;
			text-align: start;
		}
	}

	.hero-content,
	.hero-visual {
		position: relative;
		z-index: 1;
	}

	/* ── Ambient blobs ─────────────────────────────────── */
	.blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
		opacity: 0.5;
		pointer-events: none;
		z-index: 0;
	}

	.blob-1 {
		inline-size: 420px;
		block-size: 420px;
		background: var(--accent-wash);
		inset-block-start: -150px;
		inset-inline-end: -90px;
		animation: blobDrift 9s ease-in-out infinite;
	}

	.blob-2 {
		inline-size: 340px;
		block-size: 340px;
		background: var(--leaf-wash);
		inset-block-end: -110px;
		inset-inline-start: -70px;
		animation: blobDrift 11s ease-in-out infinite reverse;
	}

	@keyframes blobDrift {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		33% {
			transform: translate(20px, -16px) scale(1.04);
		}
		66% {
			transform: translate(-10px, 12px) scale(0.97);
		}
	}

	/* ── Phone mockup ──────────────────────────────────── */
	.hero-visual {
		display: flex;
		justify-content: center;
	}

	/* The bezel stays dark in both themes — a phone is a dark object, and a
	   bezel that follows the theme stops reading as a phone. The screen
	   inside deliberately matches the real lesson page's colours so this is
	   a picture of the product rather than a flattering invention. */
	.phone {
		position: relative;
		inline-size: 272px;
		max-inline-size: 100%;
		padding: 10px;
		border-radius: 38px;
		background: #15161a;
		box-shadow:
			0 24px 60px rgba(0, 0, 0, 0.28),
			0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.phone-notch {
		position: absolute;
		inset-block-start: 10px;
		/* inset-inline:0 + margin-inline:auto centres in either direction.
		   A 50% offset plus a translate only happens to work in one. */
		inset-inline: 0;
		margin-inline: auto;
		inline-size: 92px;
		block-size: 18px;
		border-end-start-radius: 12px;
		border-end-end-radius: 12px;
		background: #15161a;
		z-index: 2;
	}

	.phone-screen {
		border-radius: 28px;
		overflow: hidden;
		background: #e9e2d9;
		padding-block-end: 12px;
		min-block-size: 430px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.ph-top {
		background: #0e5c45;
		color: #fff;
		padding: 22px 14px 10px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.82rem;
		font-weight: 700;
	}

	.ph-day {
		background: rgba(255, 255, 255, 0.16);
		border-radius: 999px;
		padding: 2px 10px;
		font-size: 0.74rem;
	}

	.ph-progress {
		block-size: 4px;
		background: rgba(0, 0, 0, 0.09);
		margin-block-start: -10px;
	}

	.ph-progress span {
		display: block;
		block-size: 100%;
		background: #2ecc71;
	}

	.ph-card {
		background: #fff;
		border-radius: 14px;
		margin-inline: 12px;
		padding: 12px 14px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
		text-align: start;
	}

	/* The learner's own turn, tinted like a sent message. */
	.ph-card.said {
		background: #dcf8c6;
	}

	.ph-label {
		margin: 0 0 4px;
		font-size: 0.68rem;
		font-weight: 700;
		color: #5b6b60;
	}

	.ph-de {
		margin: 0;
		font-size: 0.92rem;
		font-weight: 700;
		color: #1c1c1c;
		unicode-bidi: isolate;
	}

	.ph-fa {
		margin: 4px 0 0;
		font-size: 0.82rem;
		color: #5a5a5a;
	}

	.ph-ok {
		margin: 6px 0 0;
		font-size: 0.74rem;
		font-weight: 700;
		color: #1e8449;
	}

	.ph-btns {
		display: flex;
		gap: 6px;
		margin-block-start: 10px;
	}

	.ph-btn {
		font-size: 0.72rem;
		font-weight: 700;
		border-radius: 999px;
		padding: 5px 12px;
	}

	.ph-btn.ghost {
		border: 1px solid #0e5c45;
		color: #0e5c45;
	}

	.ph-btn.solid {
		background: #2ecc71;
		color: #08301f;
	}

	.ph-mic {
		margin-block-start: auto;
		margin-inline: 12px;
		background: #fff;
		border-radius: 999px;
		padding: 9px;
		text-align: center;
		font-size: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
	}

	/* Decoration only. Anyone who has asked the OS to calm down should not
	   get drifting blobs behind their reading. */
	@media (prefers-reduced-motion: reduce) {
		.blob {
			animation: none;
		}
	}

	.badge {
		display: inline-block;
		margin-bottom: 18px;
		padding: 6px 14px;
		border: 1px solid var(--control-border);
		border-radius: 999px;
		background: var(--control);
		font-size: 0.85rem;
		font-weight: 600;
	}

	h1 {
		margin: 0 0 14px;
		font-family: var(--font-display);
		font-size: clamp(1.9rem, 5vw, 3rem);
		line-height: 1.4;
	}

	.grad {
		color: var(--accent);
	}

	.sub {
		margin: 0 auto 26px;
		max-width: 560px;
		color: var(--ink-soft);
		font-size: 1.1rem;
		line-height: 1.8;
	}

	.actions {
		display: flex;
		gap: 12px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		min-height: 48px;
		padding: 12px 24px;
		border-radius: 999px;
		font-weight: 700;
		text-decoration: none;
	}

	.btn.primary {
		background: var(--accent);
		color: var(--on-accent);
	}

	.btn.primary:hover {
		filter: brightness(1.08);
	}

	.btn.ghost {
		border: 1px solid var(--control-border);
		background: var(--control);
		color: var(--ink);
	}

	.btn.ghost:hover {
		background: var(--control-hover);
	}

	.note {
		margin-top: 14px;
		color: var(--ink-faint);
		font-size: 0.85rem;
	}

	.band.alt {
		background: var(--paper-sunken);
		max-width: none;
	}

	.band.alt > * {
		max-width: 900px;
		margin-inline: auto;
	}

	.eyebrow {
		margin: 0 0 6px;
		color: var(--accent);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	h2 {
		margin: 0 0 18px;
		font-family: var(--font-display);
		font-size: clamp(1.4rem, 3vw, 2rem);
	}

	.lead {
		margin: 0 auto 20px;
		max-width: 620px;
		color: var(--ink-soft);
		line-height: 1.9;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 16px;
		margin-top: 26px;
		text-align: start;
	}

	.card {
		padding: 20px;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: var(--paper-raised);
	}

	/* Numbered rules. The counter is drawn rather than using the list
	   marker, because a default RTL marker sits awkwardly against the
	   card edge and cannot be styled to match the accent. */
	.rules {
		list-style: none;
		counter-reset: rule;
		padding: 0;
		margin: 0 auto;
		max-width: 620px;
		display: grid;
		gap: 12px;
		text-align: start;
	}

	.rules li {
		counter-increment: rule;
		position: relative;
		/* Logical, not physical — the number sits at inset-inline-start, so
		   the wide side has to follow direction rather than be pinned right. */
		padding-block: 16px;
		padding-inline-start: 60px;
		padding-inline-end: 20px;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: var(--paper-raised);
		color: var(--ink-soft);
		line-height: 1.9;
	}

	.rules li::before {
		content: counter(rule);
		position: absolute;
		inset-inline-start: 18px;
		inset-block-start: 16px;
		inline-size: 28px;
		block-size: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 800;
		font-size: 0.85rem;
	}

	.rules strong {
		display: block;
		color: var(--ink);
		margin-bottom: 2px;
	}

	.card h3 {
		margin: 0 0 8px;
		font-size: 1.02rem;
		color: var(--ink);
	}

	.card p {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.94rem;
		line-height: 1.9;
	}

	.skills {
		display: flex;
		justify-content: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.skills span {
		padding: 8px 18px;
		border: 1px solid var(--control-border);
		border-radius: 999px;
		background: var(--paper-raised);
		font-weight: 600;
	}

	.faq {
		margin-top: 20px;
		text-align: start;
	}

	details {
		border-bottom: 1px solid var(--line);
	}

	summary {
		padding: 16px 4px;
		font-weight: 700;
		cursor: pointer;
		min-height: 44px;
	}

	details p {
		margin: 0;
		padding: 0 4px 16px;
		color: var(--ink-soft);
		line-height: 1.9;
	}

	.cta {
		background: var(--paper-sunken);
		max-width: none;
	}

	.switch {
		margin-top: 26px;
		font-size: 0.9rem;
	}

	.switch a {
		color: var(--ink-soft);
	}
</style>
