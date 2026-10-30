<script lang="ts">
	/**
	 * One module of a chapter, with that chapter's content for this version: what the step path
	 * (StepRunner) and the Module lab's chapter view both show. The caller keeps the record
	 * (`initial` / `onSave`) and decides what happens when it's done or skipped.
	 */
	import ActionBar from '$lib/components/ActionBar.svelte';
	import ListenConnect from '$lib/components/ListenConnect.svelte';
	import PhrasePractice from '$lib/components/PhrasePractice.svelte';
	import Traps from '$lib/components/Traps.svelte';
	import SayInEnglish from '$lib/components/SayInEnglish.svelte';
	import VoiceMessages from '$lib/components/VoiceMessages.svelte';
	import ListenRetell from '$lib/components/ListenRetell.svelte';
	import ChoosePersuade from '$lib/components/ChoosePersuade.svelte';
	import RolePlay from '$lib/components/RolePlay.svelte';
	import SayItBetter from '$lib/components/SayItBetter.svelte';
	import GroupChat from '$lib/components/GroupChat.svelte';
	import QuickChat from '$lib/components/QuickChat.svelte';
	import { asConnectRecord } from '$lib/practice/listen-connect';
	import { asPhraseRecord } from '$lib/practice/phrases';
	import { asTrapsRecord } from '$lib/practice/traps';
	import { asSayRecord as asSayInEnglishRecord } from '$lib/practice/say-in-english';
	import { asVoiceRecord } from '$lib/practice/voice-messages';
	import { asRetellRun } from '$lib/practice/retell';
	import { asPersuadeRecord } from '$lib/practice/persuade';
	import { asRolePlayRecord } from '$lib/practice/roleplay';
	import { asSayRecord } from '$lib/practice/say-better';
	import { asChatRecord } from '$lib/practice/group-chat';
	import { asQuickChat } from '$lib/practice/quick-fire';
	import { topicById, topicLevel, topicOpeners } from '$lib/practice/topics';
	import { chatSceneFor, connectSetFor, persuadeSetFor, phrasesFor, roleSceneFor, retellPieceFor, sayItemsFor, trapsFor, voiceMessagesFor } from '$lib/practice/day-content';
	import { withName } from '$lib/practice/learner-name';
	import { dayById, type DayModule, type Track } from '$lib/practice/day';

	let { dayId, mod, track, isFa = false, name = '', initial = null, afterIntro = null, onSave, onFocus, onSkip, onDone }: {
		dayId: string;
		mod: DayModule;
		track: Track;
		isFa?: boolean;
		/** The learner's first name, for "{name}" in model answers (Everyday chapters). */
		name?: string;
		/** The saved record for this run, if any (checked here before use). */
		initial?: unknown;
		/** Mira's intro playing, if any (Natural phrases waits for it). */
		afterIntro?: Promise<void> | null;
		onSave: (record: unknown) => void;
		onFocus: (mode: 'full' | 'compact' | 'hidden') => void;
		onSkip: () => void;
		onDone: (score?: { correct: number; total: number }, record?: unknown) => void;
	} = $props();

	const T = (en: string, fa: string) => (isFa ? fa : en);
	// svelte-ignore state_referenced_locally
	const content = {
		connect: connectSetFor(dayId, track), phrases: phrasesFor(dayId, track), traps: trapsFor(dayId), say: withName(sayItemsFor(dayId, track), name),
		messages: withName(voiceMessagesFor(dayId), name), story: retellPieceFor(dayId), choice: persuadeSetFor(dayId), scene: roleSceneFor(dayId, track),
		chat: chatSceneFor(dayId, track), topic: topicById(dayById(dayId)?.topic)
	};
	// svelte-ignore state_referenced_locally
	const level = topicLevel(track);
</script>

{#if mod.id === 'listen-act'}
	<ListenConnect {isFa} {onSkip} set={content.connect} initial={asConnectRecord(initial, content.connect)} {onFocus} {onSave} {onDone} />
{:else if mod.id === 'phrases'}
	<PhrasePractice {isFa} {onSkip} phrases={content.phrases} initial={asPhraseRecord(initial, content.phrases)} {afterIntro} {onFocus} {onSave} {onDone} />
{:else if mod.id === 'traps'}
	<Traps {isFa} {onSkip} traps={content.traps} initial={asTrapsRecord(initial, content.traps)} {onFocus} {onSave} {onDone} />
{:else if mod.id === 'say-in-english'}
	<SayInEnglish {isFa} {onSkip} items={content.say} initial={asSayInEnglishRecord(initial, content.say)} {onFocus} {onSave} {onDone} />
{:else if mod.id === 'voice-messages'}
	<VoiceMessages {isFa} {onSkip} messages={content.messages} initial={asVoiceRecord(initial, content.messages)} {onFocus} {onSave} {onDone} />
{:else if mod.id === 'listen-retell' && content.story}
	<ListenRetell {isFa} {onSkip} piece={content.story} voice={content.story.voice} initial={asRetellRun(initial)} {onFocus} {onSave} {onDone} />
{:else if mod.id === 'choose-persuade'}
	<ChoosePersuade {isFa} {onSkip} set={content.choice} initial={asPersuadeRecord(initial)} {onFocus} {onSave} {onDone} />
{:else if mod.id === 'scenario'}
	<RolePlay {isFa} {onSkip} scene={content.scene} initial={asRolePlayRecord(initial, content.scene)} {onFocus} {onSave} {onDone} />
{:else if mod.id === 'group-chat'}
	<GroupChat {isFa} {onSkip} scene={content.chat} initial={asChatRecord(initial, content.chat)} {onFocus} {onSave} {onDone} />
{:else if mod.id === 'quick-fire' && content.topic}
	<QuickChat {isFa} {onSkip} topic={content.topic} {level} initial={asQuickChat(initial, topicOpeners(content.topic, level))} {onFocus} {onSave} {onDone} />
{:else if mod.id === 'say-it-better'}
	<SayItBetter {isFa} {onSkip} prompt={mod.sayPrompt} initial={asSayRecord(initial)} {onFocus} {onSave} {onDone} />
{:else}
	<p>{T('This step is not ready yet.', 'این مرحله هنوز آماده نیست.')}</p>
	<ActionBar label={T('Continue', 'ادامه')} onclick={() => onDone()} />
{/if}
