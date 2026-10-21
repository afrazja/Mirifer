/**
 * The visitor funnel (landing page and sample), before there is an account: anonymous, through
 * Vercel Analytics (no account id, nothing the visitor said). The app's own analytics start
 * once the learner signs in.
 */
import { track } from '@vercel/analytics';

export type VisitorEvent = 'sample_started' | 'sample_finished' | 'signup_clicked';

export function visitorEvent(name: VisitorEvent, language: 'en' | 'fa', from?: 'landing' | 'sample'): void {
	try { track(name, { language, ...(from ? { from } : {}) }); } catch { /* analytics never get in the way */ }
}
