<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import AppHeader from "$lib/components/AppHeader.svelte";
	import CourseSwitcher from "$lib/components/CourseSwitcher.svelte";
	import { themeChoice, setTheme, type ThemeChoice } from "$services/theme";
	import {
		isAuthenticated,
		getUser,
		getDisplayName,
		updateDisplayName,
		updatePassword,
		uploadAvatar,
		removeAvatar,
		getAvatarUrl,
		signOut,
	} from "$services/auth";
	import {
		getLanguage,
		setLanguage,
		getVoiceSpeed,
		setVoiceSpeed,
		getExamSettings,
		setExamSettings,
		clearAllLocal,
		setAvatarUrl as setLocalAvatarUrl,
		setDisplayName as setLocalDisplayName,
	} from "$services/data-layer";
	import {
		getTargetLanguage,
	} from "$services/auth";
	import type { TargetLanguage } from "$lib/stores/preferences";

	// ============ STATE ============
	let isLoading = $state(true);
	let email = $state("");
	let displayName = $state("");
	let avatarUrl: string | null = $state(null);
	let currentLang = $state("en");
	let currentTargetLang = $state<TargetLanguage>("de");
	let voiceSpeed = $state(1.0);
	let langStatus = $state<{ text: string; type: "success" | "error" } | null>(
		null,
	);

	// Goethe exam plan
	let examGoal = $state<"scheduled" | "planned" | "none">("none");
	let examDate = $state("");
	let targetDate = $state("");
	let examStatus = $state<{ text: string; type: "success" | "error" } | null>(
		null,
	);
	const toISO = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	const minExamDate = toISO(new Date(Date.now() + 86400000));
	const maxExamDate = toISO(new Date(Date.now() + 2 * 365 * 86400000));

	// Password fields
	let newPassword = $state("");
	let confirmPassword = $state("");

	// Status messages
	let avatarStatus = $state<{
		text: string;
		type: "success" | "error";
	} | null>(null);
	let nameStatus = $state<{ text: string; type: "success" | "error" } | null>(
		null,
	);
	let passwordStatus = $state<{
		text: string;
		type: "success" | "error";
	} | null>(null);

	// File input ref
	let fileInput: HTMLInputElement | undefined = $state(undefined);

	// ============ COMPUTED ============
	const avatarInitial = $derived(
		(displayName || "L").charAt(0).toUpperCase(),
	);

	// ============ STATUS HELPERS ============
	function showStatus(
		setter: (
			val: { text: string; type: "success" | "error" } | null,
		) => void,
		text: string,
		type: "success" | "error",
		autoHide = true,
	) {
		setter({ text, type });
		if (autoHide && type === "success") {
			setTimeout(() => setter(null), 3000);
		}
	}

	// ============ AVATAR ============
	async function handleAvatarUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		if (file.size > 5 * 1024 * 1024) {
			showStatus(
				(v) => (avatarStatus = v),
				"Image must be less than 5MB.",
				"error",
				false,
			);
			return;
		}

		showStatus((v) => (avatarStatus = v), "Uploading...", "success", false);

		const result = await uploadAvatar(file);
		if (result.error) {
			showStatus((v) => (avatarStatus = v), result.error, "error", false);
		} else if (result.url) {
			setLocalAvatarUrl(result.url);
			avatarUrl = result.url;
			if (result.warning) {
				showStatus(
					(v) => (avatarStatus = v),
					"Photo set! Note: " + result.warning,
					"success",
					false,
				);
			} else {
				showStatus(
					(v) => (avatarStatus = v),
					"Photo updated!",
					"success",
				);
			}
		}

		// Reset file input
		target.value = "";
	}

	async function handleRemoveAvatar() {
		showStatus((v) => (avatarStatus = v), "Removing...", "success", false);

		const { error } = await removeAvatar();
		if (error) {
			showStatus((v) => (avatarStatus = v), error, "error", false);
		} else {
			setLocalAvatarUrl(null);
			avatarUrl = null;
			showStatus((v) => (avatarStatus = v), "Photo removed.", "success");
		}
	}

	// ============ DISPLAY NAME ============
	async function handleSaveName() {
		const trimmed = displayName.trim();
		if (!trimmed) {
			showStatus(
				(v) => (nameStatus = v),
				"Name cannot be empty.",
				"error",
				false,
			);
			return;
		}

		const { error } = await updateDisplayName(trimmed);
		if (error) {
			showStatus((v) => (nameStatus = v), error, "error", false);
		} else {
			setLocalDisplayName(trimmed);
			showStatus((v) => (nameStatus = v), "Name saved!", "success");
		}
	}

	// ============ PASSWORD ============
	async function handleChangePassword() {
		if (!newPassword || !confirmPassword) {
			showStatus(
				(v) => (passwordStatus = v),
				"Please fill in both fields.",
				"error",
				false,
			);
			return;
		}
		if (newPassword.length < 6) {
			showStatus(
				(v) => (passwordStatus = v),
				"Password must be at least 6 characters.",
				"error",
				false,
			);
			return;
		}
		if (newPassword !== confirmPassword) {
			showStatus(
				(v) => (passwordStatus = v),
				"Passwords do not match.",
				"error",
				false,
			);
			return;
		}

		const { error } = await updatePassword(newPassword);
		if (error) {
			showStatus((v) => (passwordStatus = v), error, "error", false);
		} else {
			showStatus(
				(v) => (passwordStatus = v),
				"Password updated!",
				"success",
			);
			newPassword = "";
			confirmPassword = "";
		}
	}

	// ============ PREFERENCES ============
	async function handleLanguageSave() {
		try {
			await setLanguage(currentLang);
			showStatus(
				(v) => (langStatus = v),
				"Display language saved!",
				"success",
			);
		} catch {
			showStatus((v) => (langStatus = v), 'Could not save your display language. Please try again.', 'error', false);
		}
	}

	function handleSpeedChange(e: Event) {
		const val = parseFloat((e.target as HTMLInputElement).value);
		voiceSpeed = val;
		setVoiceSpeed(val);
	}

	// ============ GOETHE EXAM PLAN ============
	async function handleExamSave() {
		if (examGoal === "scheduled" && !examDate) {
			showStatus(
				(v) => (examStatus = v),
				"Pick your exam date (or choose another option).",
				"error",
				false,
			);
			return;
		}
		await setExamSettings({
			goal: examGoal,
			examDate: examGoal === "scheduled" ? examDate : null,
			targetDate: examGoal === "planned" && targetDate ? targetDate : null,
		});
		showStatus((v) => (examStatus = v), "Exam plan saved!", "success");
	}

	// ============ SIGN OUT ============
	async function handleSignOut() {
		await signOut();
		window.location.href = "/";
	}

	// ============ DELETE ACCOUNT ============
	let showDelete = $state(false);
	let deleteConfirmEmail = $state("");
	let deleting = $state(false);
	let deleteStatus = $state<{
		text: string;
		type: "success" | "error";
	} | null>(null);

	// The typed address must match before the button arms. The server checks
	// this again — this is the guard against a slip, not against an attacker.
	const deleteArmed = $derived(
		email.trim().length > 0 &&
			deleteConfirmEmail.trim().toLowerCase() === email.trim().toLowerCase(),
	);

	function cancelDelete() {
		showDelete = false;
		deleteConfirmEmail = "";
		deleteStatus = null;
	}

	async function handleDeleteAccount() {
		if (!deleteArmed || deleting) return;
		deleting = true;
		deleteStatus = null;

		try {
			const res = await fetch("/settings/delete-account", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ confirmEmail: deleteConfirmEmail.trim() }),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(
					body?.message ?? "Your account could not be deleted.",
				);
			}

			// The account is gone. Wipe the offline cache directly rather than
			// relying on signOut to do it, because this page reads from
			// localStorage and a stale copy would outlive the account. signOut
			// then clears the browser's own session token; it may fail against a
			// user that no longer exists, which does not matter here.
			clearAllLocal();
			await signOut().catch(() => {});
			window.location.href = "/";
		} catch (e: any) {
			showStatus(
				(v) => (deleteStatus = v),
				e.message,
				"error",
				false,
			);
			deleting = false;
		}
	}

	// ============ LIFECYCLE ============
	onMount(async () => {
		const authed = await isAuthenticated();
		if (!authed) {
			goto("/");
			return;
		}

		// Load user info
		const user = await getUser();
		if (user) {
			email = user.email || "";
		}


		// Load display name
		const name = await getDisplayName();
		displayName = name;

		// Load avatar
		const avatar = await getAvatarUrl();
		if (avatar) {
			avatarUrl = avatar;
			setLocalAvatarUrl(avatar);
		}

		// Load preferences
		const savedLang = await getLanguage();
		if (savedLang) currentLang = savedLang;

		const savedTargetLang = await getTargetLanguage();
		if (savedTargetLang)
			currentTargetLang = savedTargetLang;

		const savedSpeed = await getVoiceSpeed();
		if (savedSpeed !== null && !isNaN(savedSpeed)) voiceSpeed = savedSpeed;

		const savedExam = await getExamSettings();
		if (savedExam) {
			examGoal = savedExam.goal;
			examDate = savedExam.examDate ?? "";
			targetDate = savedExam.targetDate ?? "";
		}

		isLoading = false;
	});
</script>

<svelte:head>
	<title>Settings - Mirifer</title>
</svelte:head>

{#if !isLoading}
	<main class="settings-container">
		<div class="settings-header">
			<AppHeader title="Settings" icon="⚙" backHref="/home" backLabel="Home" />
		</div>

	<!-- Skip-link target: absolutely positioned, so it adds no box. -->
	<span id="main-content" tabindex="-1" class="sr-only"></span>


		<!-- Profile Section -->
		<div class="settings-section">
			<h3><span class="section-icon">👤</span> Profile</h3>

			<div class="avatar-section">
				<div class="avatar-display">
					{#if avatarUrl}
						<img src={avatarUrl} alt="Avatar" />
					{:else}
						{avatarInitial}
					{/if}
				</div>
				<div class="avatar-actions">
					<button
						class="btn-secondary"
						onclick={() => fileInput?.click()}>Upload Photo</button
					>
					<input
						type="file"
						accept="image/*"
						bind:this={fileInput}
						onchange={handleAvatarUpload}
						style="display:none;"
					/>
					{#if avatarUrl}
						<button
							class="btn-secondary"
							onclick={handleRemoveAvatar}>Remove Photo</button
						>
					{/if}
				</div>
			</div>
			{#if avatarStatus}
				<div class="status-msg {avatarStatus.type}">
					{avatarStatus.text}
				</div>
			{/if}

			<div class="form-group">
				<label for="display-name">Display Name</label>
				<input
					type="text"
					id="display-name"
					placeholder="Your name"
					maxlength={40}
					bind:value={displayName}
				/>
			</div>
			<button class="btn-primary" onclick={handleSaveName}
				>Save Name</button
			>
			{#if nameStatus}
				<div class="status-msg {nameStatus.type}">
					{nameStatus.text}
				</div>
			{/if}
		</div>

		<!-- Security Section -->
		<div class="settings-section">
			<h3><span class="section-icon">🔒</span> Security</h3>

			<div class="form-group">
				<label for="new-password">New Password</label>
				<input
					type="password"
					id="new-password"
					placeholder="Min. 6 characters"
					minlength={6}
					bind:value={newPassword}
				/>
			</div>
			<div class="form-group">
				<label for="confirm-password">Confirm New Password</label>
				<input
					type="password"
					id="confirm-password"
					placeholder="Repeat password"
					minlength={6}
					bind:value={confirmPassword}
				/>
			</div>
			<button class="btn-primary" onclick={handleChangePassword}
				>Update Password</button
			>
			{#if passwordStatus}
				<div class="status-msg {passwordStatus.type}">
					{passwordStatus.text}
				</div>
			{/if}
		</div>

		<!-- Preferences Section -->
		<div class="settings-section">
			<h3><span class="section-icon">⚙</span> Preferences</h3>

			<div class="pref-row">
				<label for="pref-language">Interface Language</label>
				<select id="pref-language" bind:value={currentLang}>
					<option value="fa">فارسی</option>
					<option value="en">English</option>
				</select>
			</div>

			<CourseSwitcher language={currentLang} targetLanguage={currentTargetLang} />

			<div class="pref-row">
				<label for="pref-speed">Voice Speed (German audio)</label>
				<div class="speed-control">
					<input
						type="range"
						id="pref-speed"
						min="0.5"
						max="2.0"
						step="0.1"
						value={voiceSpeed}
						oninput={handleSpeedChange}
					/>
					<span class="speed-value">{voiceSpeed.toFixed(1)}x</span>
				</div>
			</div>

			<div class="pref-row theme-row">
				<span class="pref-label" id="pref-theme-label">Theme</span>
				<div class="target-lang-select" role="radiogroup" aria-labelledby="pref-theme-label">
					{#each [["light", "☀ Light"], ["dark", "☾ Dark"], ["system", "Match device"]] as [value, label] (value)}
						<button
							type="button"
							role="radio"
							aria-checked={$themeChoice === value}
							class="target-btn {$themeChoice === value ? 'active' : ''}"
							onclick={() => setTheme(value as ThemeChoice)}>{label}</button
						>
					{/each}
				</div>
			</div>

			<button
				class="btn-primary"
				onclick={handleLanguageSave}
				style="margin-top:8px;">Save Display Language</button
			>
			{#if langStatus}
				<div class="status-msg {langStatus.type}">
					{langStatus.text}
				</div>
			{/if}
		</div>

		<!-- Goethe Exam Section -->
		<div class="settings-section">
			<h3><span class="section-icon">🎓</span> Goethe A1 Exam</h3>

			<div class="pref-row">
				<label for="exam-goal">Your plan</label>
				<div class="target-lang-select" id="exam-goal">
					<button
						class="target-btn {examGoal === 'scheduled' ? 'active' : ''}"
						onclick={() => (examGoal = "scheduled")}
						type="button">📅 Booked</button
					>
					<button
						class="target-btn {examGoal === 'planned' ? 'active' : ''}"
						onclick={() => (examGoal = "planned")}
						type="button">🎯 Planning</button
					>
					<button
						class="target-btn {examGoal === 'none' ? 'active' : ''}"
						onclick={() => (examGoal = "none")}
						type="button">🌱 No exam</button
					>
				</div>
			</div>

			{#if examGoal === "scheduled"}
				<div class="pref-row">
					<label for="exam-date-input">Exam date</label>
					<input
						id="exam-date-input"
						class="exam-date-input"
						type="date"
						bind:value={examDate}
						min={minExamDate}
						max={maxExamDate}
					/>
				</div>
			{:else if examGoal === "planned"}
				<div class="pref-row">
					<label for="target-date-input">Ready-by target (optional)</label>
					<input
						id="target-date-input"
						class="exam-date-input"
						type="date"
						bind:value={targetDate}
						min={minExamDate}
						max={maxExamDate}
					/>
				</div>
			{/if}

			<button
				class="btn-primary"
				onclick={handleExamSave}
				style="margin-top:8px;">Save Exam Plan</button
			>
			{#if examStatus}
				<div class="status-msg {examStatus.type}">
					{examStatus.text}
				</div>
			{/if}
		</div>

		<!-- Account Section -->
		<div class="settings-section">
			<h3><span class="section-icon">📧</span> Account</h3>

			<div class="form-group">
				<span class="fake-label">Email</span>
				<div class="account-email">{email || "Loading..."}</div>
			</div>

			<button class="btn-danger" onclick={handleSignOut}>Sign Out</button>
		</div>

		<!-- Delete Account -->
		<div class="settings-section danger-zone">
			<h3><span class="section-icon">⚠</span> Delete Account</h3>

			{#if !showDelete}
				<p class="danger-lead">
					Permanently delete your account and everything in it. This
					cannot be undone.
				</p>
				<button
					class="btn-danger"
					onclick={() => (showDelete = true)}
					aria-expanded="false">Delete My Account</button
				>
			{:else}
				<p class="danger-lead">
					This permanently removes your account and all of the
					following:
				</p>
				<ul class="danger-list">
					<li>Your profile, display name and photo</li>
					<li>Your lesson progress</li>
					<li>Your review history and word strengths</li>
					<li>Your test, exam and placement results</li>
					<li>Your saved words and bookmarks</li>
				</ul>
				<p class="danger-lead">
					You will be signed out immediately. Your progress cannot be
					recovered afterwards, and starting again means beginning
					from day one.
				</p>

				<div class="form-group">
					<label for="delete-confirm">
						Type <strong>{email}</strong> to confirm
					</label>
					<input
						type="text"
						id="delete-confirm"
						autocomplete="off"
						spellcheck="false"
						placeholder={email}
						bind:value={deleteConfirmEmail}
						disabled={deleting}
					/>
				</div>

				<div class="danger-actions">
					<button
						class="btn-danger-solid"
						onclick={handleDeleteAccount}
						disabled={!deleteArmed || deleting}
					>
						{deleting ? "Deleting…" : "Delete Everything"}
					</button>
					<button
						class="btn-secondary"
						onclick={cancelDelete}
						disabled={deleting}>Keep My Account</button
					>
				</div>

				{#if deleteStatus}
					<div class="status-msg {deleteStatus.type}">
						{deleteStatus.text}
					</div>
				{/if}
			{/if}
		</div>
	</main>
{/if}

<style>
	:global(body) {
		background: var(--paper);
	}

	.settings-container {
		max-width: 600px;
		margin: 0 auto;
		padding: 40px 20px;
		min-height: 100vh;
		font-family: var(--font-body);
		color: var(--ink);
	}

	.settings-header {
		margin-bottom: 30px;
	}

	.settings-section {
		background: var(--paper-raised);
		border-radius: 18px;
		box-shadow: var(--paper-shadow);
		padding: 30px;
		margin-bottom: 20px;
		border: 1px solid var(--line);
	}

	.settings-section h3 {
		font-family: var(--font-display);
		font-size: 1.2rem;
		margin-bottom: 20px;
		color: var(--accent-deep);
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.section-icon {
		font-size: 1.3rem;
	}

	.form-group {
		margin-bottom: 15px;
	}

	.form-group label,
	.form-group .fake-label {
		display: block;
		font-size: 0.9rem;
		color: var(--ink-soft);
		margin-bottom: 6px;
	}

	.form-group input[type="text"],
	.form-group input[type="password"] {
		width: 100%;
		padding: 12px;
		border-radius: 10px;
		border: 1px solid var(--line);
		background: var(--paper-sunken);
		color: var(--ink);
		font-size: 1rem;
		transition: border-color 0.3s ease;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.btn-primary {
		padding: 10px 24px;
		border-radius: 10px;
		border: none;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 5px 18px rgba(46, 204, 113, 0.3);
	}

	.btn-secondary {
		padding: 10px 24px;
		border-radius: 10px;
		border: 1px solid var(--line);
		background: transparent;
		color: var(--ink);
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-secondary:hover {
		border-color: var(--accent);
		background: var(--accent-wash);
	}

	.btn-danger {
		padding: 10px 24px;
		border-radius: 10px;
		border: 1px solid rgba(231, 76, 60, 0.4);
		background: rgba(231, 76, 60, 0.07);
		color: #e74c3c;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-danger:hover {
		background: rgba(231, 76, 60, 0.16);
		border-color: #e74c3c;
	}

	/* ── Delete account ── */
	.danger-zone {
		border-color: rgba(231, 76, 60, 0.35);
	}

	.danger-zone h3 {
		color: #e74c3c;
	}

	.danger-lead {
		font-size: 0.9rem;
		color: var(--ink-soft);
		line-height: 1.6;
		margin: 0 0 14px;
	}

	.danger-list {
		margin: 0 0 14px;
		padding-left: 22px;
		font-size: 0.9rem;
		color: var(--ink-soft);
		line-height: 1.75;
	}

	.danger-actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		margin-top: 4px;
	}

	.btn-danger-solid {
		padding: 10px 24px;
		border-radius: 10px;
		border: 1px solid #c0392b;
		background: #e74c3c;
		color: #fff;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-danger-solid:hover:not(:disabled) {
		background: #c0392b;
	}

	.btn-danger-solid:disabled,
	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.avatar-section {
		display: flex;
		align-items: center;
		gap: 25px;
		margin-bottom: 20px;
	}

	.avatar-display {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--on-accent);
		border: 4px solid var(--line);
		overflow: hidden;
		flex-shrink: 0;
	}

	.avatar-display img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.status-msg {
		padding: 10px 15px;
		border-radius: 10px;
		font-size: 0.9rem;
		margin-top: 10px;
	}

	.status-msg.success {
		background: var(--leaf-wash);
		color: var(--leaf);
		border: 1px solid var(--leaf);
	}

	.status-msg.error {
		background: rgba(231, 76, 60, 0.08);
		color: #e74c3c;
		border: 1px solid rgba(231, 76, 60, 0.35);
	}

	.pref-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 0;
		border-bottom: 1px solid var(--line);
	}

	.pref-row:last-child {
		border-bottom: none;
	}

	.pref-row label,
	.pref-row .pref-label {
		font-size: 1rem;
		color: var(--ink);
	}

	.pref-row select {
		padding: 8px 16px;
		border-radius: 10px;
		border: 1px solid var(--line);
		background: var(--paper-sunken);
		color: var(--ink);
		font-size: 0.95rem;
		cursor: pointer;
	}

	.pref-row select option {
		background: var(--paper-raised);
		color: var(--ink);
	}

	.speed-control {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.speed-control input[type="range"] {
		width: 120px;
		accent-color: var(--accent);
	}

	.speed-value {
		font-size: 0.9rem;
		color: var(--accent-deep);
		font-weight: 600;
		min-width: 40px;
		text-align: center;
	}

	.target-lang-select {
		display: flex;
		gap: 8px;
	}

	/* Three choices need more room than one select: on narrow screens the
	   buttons move under the label instead of squeezing it. */
	.theme-row {
		flex-wrap: wrap;
		gap: 10px;
	}

	.theme-row .target-btn {
		white-space: nowrap;
	}

	.exam-date-input {
		background: var(--paper-raised);
		border: 1.5px solid var(--line);
		border-radius: 10px;
		padding: 9px 12px;
		font-size: 0.95rem;
		font-family: var(--font-body);
		color: var(--ink);
	}

	.exam-date-input:focus {
		border-color: var(--accent);
		outline: none;
	}

	/* Explanatory copy under a section heading. */
	.pref-hint {
		margin: 0 0 14px;
		color: var(--ink-soft);
		font-size: 0.9rem;
		line-height: 1.75;
	}

	/* Outlined rather than filled: resetting a placement is reversible and
	   affects no completed work, so it should not look like deleting an
	   account. It still reads as the consequential control in its section. */
	.danger-btn {
		font: inherit;
		font-weight: 700;
		font-size: 0.92rem;
		min-height: 44px;
		padding: 10px 18px;
		border-radius: 10px;
		background: transparent;
		color: var(--accent);
		border: 1px solid var(--accent);
		cursor: pointer;
	}

	.danger-btn:hover:not(:disabled) {
		background: var(--accent-wash);
	}

	.danger-btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.target-btn {
		padding: 7px 14px;
		border-radius: 10px;
		border: 1px solid var(--line);
		background: var(--paper-sunken);
		color: var(--ink);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.target-btn.active {
		border-color: var(--accent);
		background: var(--accent-wash);
	}

	.account-email {
		font-size: 1rem;
		color: var(--ink-soft);
		padding: 12px;
		background: var(--paper-sunken);
		border-radius: 10px;
		margin-bottom: 15px;
		word-break: break-all;
	}

	@media (max-width: 600px) {
		.avatar-section {
			flex-direction: column;
			text-align: center;
		}

		.settings-section {
			padding: 20px;
		}
	}
</style>
