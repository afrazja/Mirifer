/** The landing pages' structured data (search): the app and its questions, in the page's language. */
import { LANDING, type LandingLang } from './copy';

const json = (value: unknown) => `<script type="application/ld+json">${JSON.stringify(value).replace(/</g, '\\u003c')}</script>`;

export function landingStructuredData(lang: LandingLang): string {
	const c = LANDING[lang];
	const url = lang === 'fa' ? 'https://www.mirifer.com/fa' : 'https://www.mirifer.com/';
	return json({
		'@context': 'https://schema.org', '@type': 'WebApplication', name: 'Mirifer', url, inLanguage: lang,
		applicationCategory: 'EducationalApplication', operatingSystem: 'Web', description: c.description,
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
	}) + json({
		'@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang,
		mainEntity: c.faq.items.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } }))
	});
}
