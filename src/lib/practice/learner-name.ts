/**
 * "{name}" in model answers (Everyday chapters: "Hi, I'm {name}, in 3C."): the learner's own first
 * name, or a plain stand-in when we don't have one. Only strings change; patterns and functions stay.
 */
export const firstName = (name: string | null | undefined) => (name ?? '').trim().split(/\s+/)[0]?.slice(0, 20) || '';

export function withName<T>(value: T, name: string | null | undefined, standIn = 'Sam'): T {
	const shown = firstName(name) || standIn;
	const walk = (item: unknown): unknown => {
		if (typeof item === 'string') return item.includes('{name}') ? item.replaceAll('{name}', shown) : item;
		if (Array.isArray(item)) return item.map(walk);
		if (item && typeof item === 'object' && Object.getPrototypeOf(item) === Object.prototype) {
			return Object.fromEntries(Object.entries(item).map(([key, inner]) => [key, walk(inner)]));
		}
		return item; // RegExp, functions, dates: as they are
	};
	return walk(value) as T;
}
