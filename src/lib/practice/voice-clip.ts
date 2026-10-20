/**
 * Short spoken answers that only need to be turned into text: Mira's greeting, the role-plays
 * and the recap's "say it again". They are recorded in the browser and sent once to our server,
 * which transcribes them (OpenAI) like every other speaking module. Shared by the page and the
 * server, so both agree on the limits.
 */
export const CLIP_USES = ['greeting', 'role-play', 'say-again'] as const;
export type ClipUse = (typeof CLIP_USES)[number];

/** The longest recording for each use, in seconds. */
export const CLIP_SECONDS: Record<ClipUse, number> = { greeting: 20, 'role-play': 30, 'say-again': 12 };

export const isClipUse = (value: unknown): value is ClipUse => typeof value === 'string' && (CLIP_USES as readonly string[]).includes(value);
