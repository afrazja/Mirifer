/**
 * Persian text with English inside it: each run of Latin text is shown as its own isolated
 * left-to-right piece. Without this, two English words separated only by quotes and a comma
 * («should»، «could») are joined into one left-to-right run and the punctuation is scrambled.
 */
export interface TextPart { text: string; latin: boolean }
const LATIN_RUN = /([A-Za-z](?:[A-Za-z0-9’'.\- ·]*[A-Za-z0-9’'])?)/;
export function latinRuns(text: string): TextPart[] {
	return text.split(LATIN_RUN).map((part, i) => ({ text: part, latin: i % 2 === 1 })).filter(part => part.text);
}
