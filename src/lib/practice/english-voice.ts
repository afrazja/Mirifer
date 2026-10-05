/**
 * One speaking pace for every English voice in the English course, set by
 * the owner from Mira's voice (10% faster than the earlier 0.95).
 *
 * - ENGLISH_RATE: the free Edge voices (Mira, Listen and act, the recap's
 *   "Try" sentence, the hotel fallback). With the English base of 0.8 this
 *   is about 197 words a minute.
 * - RECORDED_ENGLISH_RATE: the playback speed for the OpenAI voice
 *   (Listen & retell stories, Jamie at the hotel, improved sentences), which
 *   speaks at about 185 words a minute, so it is sped up to the same pace.
 *
 * German has its own speed and setting; nothing here touches it.
 */
export const ENGLISH_RATE = 1.05;
export const RECORDED_ENGLISH_RATE = 1.06;
