# "Minimal pairs duel" (Module lab): spec v1

Status: **approved by the owner in chat ("Do as all your recommendations") and built (Module lab).**

Owner's decisions (all as recommended):
- speaking is record-and-compare only, not scored (speech-to-text "corrects" these sounds to the nearest real word, so it can't judge them; scoring waits for Azure pronunciation assessment);
- 12 duels a round;
- one replay per duel.

Update: an experimental on-device pronunciation check is reached from the result screen; see `english-pronounce-check-spec.md`.

## Purpose

Training the ear on English sound pairs Persian speakers mix up. If you can't hear a difference, you can't say it. Short, with a clear end and a clear score.

## Sound pairs (6 × 2 word pairs = 12 duels)

| Sounds | Word pairs |
|---|---|
| short i / long ee | ship / sheep, live / leave |
| a / e | bad / bed, man / men |
| v / w | vest / west, vine / wine |
| b / v | berry / very, boat / vote |
| th / s | think / sink, mouth / mouse |
| th / t | three / tree, thin / tin |

Each sound pair has a one-line mouth tip in English and Persian.

## The flow

1. **Start.** Mira: "You'll hear one word. Two words will be on the screen: tap the one you heard…". Bottom: "Start".
2. **A duel** (one screen each, progress strip).
   - Two big buttons with the pair; the word (picked at random each round) plays by itself. The buttons unlock once it has played.
   - Quiet: "▶ Hear it again" (once).
   - Tap: ✓ Right / ✗ It was "…", the buttons coloured, and both words played one after the other ("▶ Hear both: ship … sheep", unlimited). A wrong answer also shows the tip. Bottom: "Next".
   - Order is shuffled; the same sound pair never comes twice in a row.
3. **Result.**
   - "9 of 12 right", and ✓/✗ with right/total for each sound pair.
   - Your hardest sounds (most misses, earliest on a tie): the tip, ▶ Mira saying the word pair you missed, then "Say them" (records up to 5 s, in memory only), ▶ Me, and "Does yours sound like two different words? This isn't scored."
   - Bottom: "Done". Quiet: "Practise my weak sounds" (a practice round of only the missed sound pairs, every word once) and "Try a new round". A perfect round says "A perfect ear".

## Audio, data, cost

- US voice "Brian"; 24 fixed words, cached; the next duel's word is fetched in advance.
- No AI, no speech-to-text. Saved in this browser only: the round, taps and replays. The recording is never stored or sent.
- **To check:** listen once to the real voice on all 24 words; isolated words can be read oddly. A word that sounds wrong is replaced.
