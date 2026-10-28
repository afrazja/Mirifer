/**
 * Everyday 2, "Making plans": the chapter's content, written from one brief
 * (docs/english-everyday-2/README.md) and reviewed. The chapter itself (EVERYDAY_TWO) is in ./pack;
 * the group chat (step 5) is in ../../chats.
 */
import type { Track } from '../../day';
import type { ChatScene } from '../../group-chat';
import { BIRTHDAY_A2, BIRTHDAY_B1 } from '../../chats';

export * from './listening';
export * from './phrases';
/** Step 5: Nina's 30th, at each version's level. */
export const CHATS: Partial<Record<Track, ChatScene>> = { intermediate: BIRTHDAY_A2, professional: BIRTHDAY_B1 };
