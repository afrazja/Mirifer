/**
 * "Group chat" (docs/english-group-chat-spec.md, owner's idea 2026-10-28): the learner plans
 * something with AI friends in a WhatsApp-style group, by voice notes (the main way) or typed
 * messages. Like a role-play (roleplay.ts), a chat has a fact sheet, goals reached by the learner's
 * own messages, an optional twist, fallback lines, and Mira's one note at the end; unlike it, several
 * friends talk (one or two messages per round, one question at most, always last) and the register
 * is casual chat.
 *
 * Shared by the page and the server. The server asks the model for the friends' messages, each goal
 * with the learner's own words as evidence (checked here: a friend's line or a bare "ok" to a
 * friend's plan never counts), and the plan agreed so far (which decides whether the twist clashes).
 */
import type { DisplayText } from './hotel';
import type { RoleGoal } from './roleplay';

/** The longest message the server takes at all; each level has its own cap (CHAT_CHARS). */
export const MAX_CHAT_MESSAGE = 300;
/** The learner's messages in one chat, by level (the chat closes warmly at the cap). */
export const CHAT_TURNS = { a2: 8, b1: 12 } as const;
/** The longest typed message, by level. */
export const CHAT_CHARS = { a2: 200, b1: 300 } as const;
/** The friends' messages: at most this many words (the model is told; the server allows a little more). */
export const FRIEND_WORDS = { a2: 12, b1: 15 } as const;
export type ChatLevel = keyof typeof CHAT_TURNS;
/** The end review rewrites at most this many of the learner's messages (the feedback budget). */
export const MAX_REWRITES = 2;

export interface ChatMember {
	id: string;
	name: string;
	/** Their name's colour on a friend bubble (each has a light- and a dark-theme shade, 4.5:1 or more). */
	color: 'violet' | 'orange' | 'blue';
	/** Their voice for voice notes (the voice route's slots). */
	voice: 'a' | 'b' | 'c' | 'd';
}

/** A message. `fa`: its meaning in Persian, shown when the learner taps "Meaning" (prepared lines and the AI's). */
export type ChatLine = { from: string; text: string; voice?: boolean; fa?: string };
/** A Persian meaning is used only if it is Persian and short. */
export const meaningOk = (fa: unknown): fa is string => typeof fa === 'string' && /[\u0600-\u06FF]/.test(fa) && fa.trim().length > 0 && fa.length <= 300;

/** What has been agreed so far, as the model reads the chat (it decides only whether the twist clashes). */
export interface ChatPlan { day: string | null; time: number | null; place: string | null }

export interface ChatTurn {
	met: readonly string[];
	/** The twist message is already in the chat. */
	twistSaid: boolean;
	/** The learner's last two messages reached nothing: ask straight about the next open goal. */
	stalled: boolean;
	/** The learner's last message: close the chat warmly, no question. */
	last: boolean;
	learnerName: string | null;
}

export interface ChatScene {
	id: string;
	level: ChatLevel;
	/** The first run's variant, then the replay's. */
	variants: readonly [string, string];
	group: { name: string; emoji: string };
	members: ChatMember[];
	/** The members the model plays; the others only say scripted lines (A2: Leo's reactions). */
	played: string[];
	/** The messages already in the group when the learner opens it. */
	opening: (variant: string) => ChatLine[];
	goals: RoleGoal[];
	/**
	 * Said when the model's messages fail the checks: one per goal still open (asking about it),
	 * 'after-twist' (the reopened goal, once the news is in), 'done' (a warm closing line) and
	 * 'end' (out of messages: "let's finish this tomorrow").
	 */
	fallback: (variant: string) => Record<string, ChatLine>;
	/** Everything the friends may know (every number they may say is on it). */
	facts: (variant: string) => string;
	/** The friends' instructions for one round. */
	prompt: (variant: string, turn: ChatTurn) => string;
	/** Words the friends never use (formal letter words, alcohol; at A2, abbreviations). */
	banned?: RegExp;
	/** A scripted reaction when the learner's message reaches a goal (A2: Leo's "Works for me! 👍"). */
	reactions?: Record<string, ChatLine>;
	/** Why a message with a price is refused (fed back to the model for its rewrite). */
	priceReason: string;
	/** Prices the friends may say (on the fact sheet), e.g. /\$20\b/. */
	allowedPrices?: RegExp;
	twist?: {
		/** The goal that must be reached first, and that opens again with the news. */
		reopens: string;
		/** Goals reached in all (with `reopens`) before it comes. */
		minGoals: number;
		/** Whether the plan agreed so far runs into the news (no clash: no twist, and nothing lost). */
		clash: (plan: ChatPlan) => boolean;
		message: ChatLine;
		/** What the friends know once it is said (added to the fact sheet). */
		news: string;
		/** Words that give it away before it is sent. */
		leak: RegExp;
	};
	/** For the end review: what the chat was. */
	review: string;
	/** How the friends' voice notes should sound (the voice route's direction). */
	voiceDirection: string;
	/** Mira's notes; see chatNote for which one shows. */
	notes: Record<string, DisplayText>;
	screen: {
		/** One line: the situation. */
		situation: DisplayText;
		goalsHeading: DisplayText;
		/** Under "Done." on the result screen. */
		resultLead: DisplayText;
		start?: DisplayText;
	};
}

export type ChatMessage = ChatLine & { seconds?: number };

/** What the end review's rewrite was about (Mira's note can follow it). */
export const REWRITE_KINDS = ['formal', 'taarof', 'long', 'question', 'future', 'preposition', 'agree', 'pronoun', 'other'] as const;
export interface ChatUpgrade { original: string; better: string; why: DisplayText; kind?: string }

/** One run of a chat, as the step keeps it in this browser (reload, Back). */
export interface ChatRecord {
	variant: string;
	messages: ChatMessage[];
	goals: string[];
	proof: string | null;
	done: boolean;
	/** The chat closed: every goal agreed, or out of messages. */
	settled: boolean;
	/** Learner messages in a row that reached nothing new (Maya then asks about the next goal). */
	quiet: number;
	review: ChatUpgrade[] | null;
	/** Seconds of the learner's voice notes (talk time; typed messages count 0). */
	voiceSeconds: number;
}

export const LEARNER = 'you';
export const chatGoalIds = (scene: ChatScene) => scene.goals.map(goal => goal.id);
export const chatTurns = (scene: ChatScene) => CHAT_TURNS[scene.level];
export const chatChars = (scene: ChatScene) => CHAT_CHARS[scene.level];
export const learnerMessages = <T extends ChatLine>(messages: readonly T[]) => messages.filter(m => m.from === LEARNER);
export const memberOf = (scene: ChatScene, id: string) => scene.members.find(member => member.id === id);

export const startChat = (scene: ChatScene, variant = scene.variants[0]): ChatRecord =>
	({ variant, messages: scene.opening(variant).map(message => ({ ...message })), goals: [], proof: null, done: false, settled: false, quiet: 0, review: null, voiceSeconds: 0 });

/** The prepared message for the first goal still open (the reopened one once the news is in), or the closing one. */
export function chatFallback(scene: ChatScene, variant: string, goals: readonly string[], twistSaid: boolean): ChatLine {
	const lines = scene.fallback(variant);
	const open = chatGoalIds(scene).find(id => !goals.includes(id));
	if (open && twistSaid && open === scene.twist?.reopens && lines['after-twist']) return lines['after-twist'];
	return lines[open ?? 'done'];
}
/** Where the twist message is in the chat, or -1. */
export const twistIndex = (scene: ChatScene, messages: readonly ChatLine[]) =>
	scene.twist ? messages.findIndex(m => m.from === scene.twist!.message.from && m.text === scene.twist!.message.text) : -1;
export const chatTwistSent = (scene: ChatScene, messages: readonly ChatLine[]) => twistIndex(scene, messages) >= 0;

/** Every line the friends say that isn't AI-written (the voice route voices these without a signature). */
export const chatPreparedLines = (scene: ChatScene): string[] => [
	...scene.variants.flatMap(variant => [...scene.opening(variant), ...Object.values(scene.fallback(variant))]),
	...Object.values(scene.reactions ?? {}), ...(scene.twist ? [scene.twist.message] : [])
].map(line => line.text);

export const normaliseWords = (text: string) => text.toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9']+/g, ' ').trim();

/**
 * The goals the model's evidence really supports: each claim names a learner message (1-based,
 * counting the learner's messages only) and the learner's own words in it. A quote that isn't in
 * that message doesn't count; the reopened goal counts only from a message after the twist.
 */
export function evidencedGoals(
	scene: ChatScene, messages: readonly ChatLine[], claims: readonly { id: string; msg: number; quote: string }[]
): string[] {
	const ids = chatGoalIds(scene);
	const mine = messages.map((m, index) => ({ ...m, index })).filter(m => m.from === LEARNER);
	const twistAt = twistIndex(scene, messages);
	const reached = new Set<string>();
	for (const claim of claims) {
		if (!ids.includes(claim.id)) continue;
		const message = mine[claim.msg - 1];
		const quote = normaliseWords(claim.quote);
		if (!message || !quote || !normaliseWords(message.text).includes(quote)) continue;
		if (claim.id === scene.twist?.reopens && twistAt >= 0 && message.index < twistAt) continue;
		reached.add(claim.id);
	}
	return ids.filter(id => reached.has(id));
}

/** Names and numbers in the rewrite must come from the learner's own message (no new places or times). */
export function rewriteAddsFacts(original: string, better: string): boolean {
	const own = new Set(normaliseWords(original).split(' '));
	for (const match of better.matchAll(/\b(?:\d+|[A-Z][a-z]+(?:['’]s)?)\b/g)) {
		const plain = normaliseWords(match[0]).replace(/'s$/, '');
		// A sentence's first word, and "I", are capitalised anyway.
		const before = better.slice(0, match.index).trimEnd();
		if (/^\D/.test(match[0]) && (!before || /[.!?…:]$/.test(before))) continue;
		if (own.has(plain) || own.has(`${plain}'s`)) continue;
		return true;
	}
	return false;
}

/**
 * Mira's one note: the first that applies. The twist missed; a goal not reached; what the end review
 * found most (taarof, too formal, too long); the twist solved; all done.
 */
export function chatNote(scene: ChatScene, record: Pick<ChatRecord, 'goals' | 'done' | 'messages' | 'review'>): DisplayText | null {
	const notes = scene.notes;
	const twist = !!scene.twist && chatTwistSent(scene, record.messages);
	if (twist && !record.goals.includes(scene.twist!.reopens) && notes['twist-none']) return notes['twist-none'];
	const open = chatGoalIds(scene).find(id => !record.goals.includes(id));
	if (open && notes[open]) return notes[open];
	const kinds = (record.review ?? []).map(item => item.kind);
	for (const kind of ['taarof', 'formal', 'long']) if (kinds.includes(kind) && notes[kind]) return notes[kind];
	if (twist && notes['twist-solved']) return notes['twist-solved'];
	return record.done ? notes.done ?? null : null;
}

const isText = (value: unknown): value is DisplayText => !!value && typeof (value as DisplayText).en === 'string' && typeof (value as DisplayText).fa === 'string';
/** A saved run for this scene, or null. */
export function asChatRecord(value: unknown, scene: ChatScene): ChatRecord | null {
	const r = value as Partial<ChatRecord> | null;
	if (!r || typeof r !== 'object' || typeof r.variant !== 'string' || !scene.variants.includes(r.variant) || typeof r.done !== 'boolean') return null;
	const members = new Set([LEARNER, ...scene.members.map(m => m.id)]);
	if (!Array.isArray(r.messages) || !r.messages.length || !r.messages.every(m => m && members.has(m.from) && typeof m.text === 'string')) return null;
	if (!Array.isArray(r.goals) || !r.goals.every(g => typeof g === 'string')) return null;
	if (r.proof !== null && typeof r.proof !== 'string') return null;
	if (r.review !== null && r.review !== undefined && (!Array.isArray(r.review) || !r.review.every(u => u && typeof u.original === 'string' && typeof u.better === 'string' && isText(u.why)))) return null;
	return {
		variant: r.variant, messages: r.messages, goals: r.goals, proof: r.proof ?? null, done: r.done, settled: r.settled === true || r.done,
		quiet: typeof r.quiet === 'number' ? r.quiet : 0, review: r.review ?? null, voiceSeconds: typeof r.voiceSeconds === 'number' ? r.voiceSeconds : 0
	};
}
