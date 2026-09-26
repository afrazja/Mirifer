/**
 * English "Listen & retell": the learner listens to a short piece, then
 * retells it in their own words.
 *
 * There is no minimum speaking time. Each piece has a maximum, which the
 * learner sees before they start and which stops the recording: longer
 * listening allows longer speaking, up to 2 minutes (see `speakLimit`).
 * Key points are written with the piece, so feedback checks the retelling
 * against them rather than judging freely.
 */
import type { DisplayText } from './hotel';

export const RETELL_ID = 'retell-v1';

export interface RetellPiece {
	id: string;
	title: DisplayText;
	level: 'A2' | 'B1' | 'B2';
	text: string;
	/** What a complete retelling covers, in plain English. */
	keyPoints: string[];
}

/**
 * The narration comes out at about 185 words a minute, too fast for
 * learners, so the browser slows playback (pitch is preserved).
 */
export const PLAYBACK_RATE: Record<RetellPiece['level'], number> = { A2: 0.85, B1: 0.9, B2: 1 };
const NARRATION_WORDS_PER_SECOND = 3.1;

/** Listening time at the piece's playback rate. */
export function listenSeconds(piece: Pick<RetellPiece, 'text' | 'level'>): number {
	const words = piece.text.trim().split(/\s+/).length;
	return Math.round(words / (NARRATION_WORDS_PER_SECOND * PLAYBACK_RATE[piece.level]));
}

/**
 * The most a learner may speak for a piece: 90 seconds for short listening
 * (up to 1:30), 2 minutes for anything longer, however long it is.
 */
export function speakLimit(piece: Pick<RetellPiece, 'text' | 'level'>): number {
	return listenSeconds(piece) <= 90 ? 90 : 120;
}

/** Plays allowed before retelling. */
export const MAX_LISTENS = 2;

export function formatDuration(seconds: number): string {
	const whole = Math.max(0, Math.round(seconds));
	return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export const RETELL_PIECES: RetellPiece[] = [
	{
		id: 'lost-phone',
		title: { en: 'The phone in the taxi', fa: 'گوشی در تاکسی' },
		level: 'A2',
		text: 'Last Friday, Maria took a taxi home from the airport. She was very tired after a long flight, and she fell asleep in the back seat. When she arrived, she paid the driver, took her suitcase and went inside. Ten minutes later, she wanted to call her mother, but her phone wasn’t in her bag. She checked her coat and her suitcase, but it wasn’t there. She was sure it was in the taxi. Maria didn’t know the driver’s name, but she still had the receipt, and there was a phone number on it. She used her neighbour’s phone to call the taxi company. The woman who answered was very kind. She called the driver, and he found the phone under the back seat. An hour later, he brought it to Maria’s door. She wanted to give him some money to say thank you, but he only asked for a cup of coffee.',
		keyPoints: [
			'Maria took a taxi home from the airport and fell asleep because she was tired.',
			'At home she realised her phone was missing and thought it was in the taxi.',
			'She called the taxi company with the number on her receipt, using her neighbour’s phone.',
			'The driver found the phone under the seat and brought it to her door.',
			'He didn’t want money, only a cup of coffee.'
		]
	},
	{
		id: 'four-day-week',
		title: { en: 'A shorter working week', fa: 'هفتهٔ کاری کوتاه‌تر' },
		level: 'B1',
		text: 'A small design company tried something new last year: its twelve workers stopped working on Fridays, but they kept the same salary. The manager, Tom, was worried at first. He thought clients would be unhappy and the team would not finish their work on time. After six months, the results surprised him. People took fewer sick days, and they were more focused during the week. Instead of long meetings, the team had a short fifteen-minute meeting every morning. They also agreed to check their email only twice a day, so they had more time for real work. Not everything was easy. Some clients wanted answers on Fridays, so the team took turns being available by phone. One designer said the extra day off had changed her life: she started painting again and spent more time with her children. The company has now decided to keep the four-day week, and two other local businesses have asked Tom for advice.',
		keyPoints: [
			'A small company gave its workers Fridays off without cutting their pay.',
			'The manager was worried about clients and deadlines.',
			'After six months, people took fewer sick days and were more focused.',
			'They changed how they worked: short morning meetings and checking email only twice a day.',
			'Some clients wanted answers on Fridays, so staff took turns being available.',
			'The company is keeping the four-day week, and other businesses want advice.'
		]
	},
	{
		id: 'night-market',
		title: { en: 'The market that comes out at night', fa: 'بازاری که شب‌ها برپا می‌شود' },
		level: 'B1',
		text: 'Ten years ago, the centre of the small town of Harwick was almost empty in the evenings. Most shops closed at half past five, and people drove to a big shopping centre outside town instead. A local baker called Priya Shah decided to do something about it. Her idea was simple: a market that opened only at night, once a week, in the old car park behind the town hall. She asked ten friends who made food, jewellery and furniture to join her. On the first night, it rained heavily, and only about fifty people came. Priya almost gave up. But the people who came told their friends. By the end of the first summer, more than a thousand visitors were coming every Thursday, and the market had grown from ten stalls to sixty. There was live music, and local schools sold things their students had made. The market also changed the town in ways nobody expected. Cafés and restaurants nearby started staying open later, and three new shops opened on the main street. The town council, which had not helped at first, began paying for better lights and extra rubbish bins. There were problems too. Some people who lived near the car park complained about the noise and the parking. Priya met them and agreed to finish the music at nine o’clock and to ask visitors to park at the train station. After that, most of the complaints stopped. Today the market is run by a small team of volunteers, and Priya spends more time in her bakery again. She says the best thing about the market is not the money it brings to the town. It is that people who have lived on the same street for years finally know each other’s names.',
		keyPoints: [
			'The town centre was empty in the evenings because shops closed early and people went to a shopping centre.',
			'A baker, Priya, started a weekly night market in an old car park.',
			'The first night went badly, with rain and few visitors, and she almost gave up.',
			'Word of mouth made it grow to over a thousand visitors and sixty stalls.',
			'It helped the town: cafés stayed open later, new shops opened, and the council paid for lights and bins.',
			'Neighbours complained about noise and parking, so the music ends at nine and visitors park at the station.',
			'Volunteers run it now, and for Priya the best part is that neighbours know each other.'
		]
	}
];

export const getPiece = (id: string) => RETELL_PIECES.find(piece => piece.id === id) ?? null;
