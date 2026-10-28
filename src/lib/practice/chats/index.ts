/** Every group chat scene (group-chat.ts), by id. */
import type { ChatScene } from '../group-chat';
import { BIRTHDAY_A2, BIRTHDAY_B1 } from './birthday';

export const ALL_CHAT_SCENES: ChatScene[] = [BIRTHDAY_A2, BIRTHDAY_B1];
export const chatSceneById = (id: string | null | undefined): ChatScene | null => ALL_CHAT_SCENES.find(scene => scene.id === id) ?? null;
export { BIRTHDAY_A2, BIRTHDAY_B1 };
