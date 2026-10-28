/**
 * Short spoken answers that only need to be turned into text: Mira's greeting, the role-plays,
 * the recap's "say it again" and the group chat's voice notes. They are recorded in the browser and sent once to our server,
 * which transcribes them (OpenAI) like every other speaking module. Shared by the page and the
 * server, so both agree on the limits.
 */
export const CLIP_USES = ['greeting', 'role-play', 'say-again', 'group-chat'] as const;
export type ClipUse = (typeof CLIP_USES)[number];

/** The longest recording for each use, in seconds. */
export const CLIP_SECONDS: Record<ClipUse, number> = { greeting: 20, 'role-play': 30, 'say-again': 12, 'group-chat': 30 };

export const isClipUse = (value: unknown): value is ClipUse => typeof value === 'string' && (CLIP_USES as readonly string[]).includes(value);

/**
 * The largest clip the server takes for a use: its time limit at 128 kbps (twice what the page
 * asks the recorder for, as some phones ignore it), plus room for the file header.
 */
export const maxClipBytes = (use: ClipUse) => CLIP_SECONDS[use] * 16_000 + 20_000;
