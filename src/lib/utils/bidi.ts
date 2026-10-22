/**
 * Persian text with English inside it: each run of Latin text is shown as its own isolated
 * left-to-right piece. Without this, two English words separated only by quotes and a comma
 * («should»، «could») are joined into one left-to-right run and the punctuation is scrambled.
 */
export interface TextPart { text: string; latin: boolean }
// A run may end with an English ? or ! (Persian uses ؟), which then stays with its English words.
// An ellipsis or a slash between English words stays inside the run ("on the … floor", "lend / borrow");
// split apart, a right-to-left line shows the pieces in the wrong order.
const LATIN_RUN = /([A-Za-z](?:[A-Za-z0-9’'.\- ·…/]*[A-Za-z0-9’'])?[?!]*)/;
export function latinRuns(text: string): TextPart[] {
	return text.split(LATIN_RUN).map((part, i) => ({ text: part, latin: i % 2 === 1 })).filter(part => part.text);
}
