# On-device pronunciation check (Module lab experiment)

**Removed from the app on 2026-10-20 (owner's decision):** few learners would use it on its own, and it was the only module using the on-device speech model. The idea may come back inside another module. The full code (module, on-device check, tests) is in git history: restore it from commit `f09ebba` (paths `src/lib/practice/minimal-pairs.ts`, `pronounce-local.ts`, `src/lib/services/local-pronounce.ts`, `src/lib/components/MinimalPairs.svelte`, `PronounceCheck.svelte`, `src/routes/practice/english/lab/minimal-pairs/`), plus the `@huggingface/transformers` dependency and the `onnxruntime-web` alias in `vite.config.js`.

Status: **experiment, owner-approved in chat** ("lets try number 2, but I dont want the size get bigger than 100 mg"). Only in the Module lab (owner-only), reached from the Minimal pairs result.

## Why

Speech-to-text "corrects" a learner's sound to the nearest real word, so it can't judge minimal pairs. Azure pronunciation assessment would, but Azure isn't available to the owner. This check runs a small speech model on the phone instead: no server, no cost per use, and the voice never leaves the device.

## How it works

- **Model:** `Xenova/wav2vec2-base-960h`, 4-bit weights with 16-bit activations (`q4f16`, 66.5 MB). It turns audio into letter probabilities frame by frame. It has no language model, so it doesn't "repair" an accent into a real word.
- **Engine:** transformers.js 3 with the plain WebAssembly build of onnxruntime-web (11.1 MB, 2.9 MB compressed), served from our own site (not a CDN). Vite aliases `onnxruntime-web` to its WebAssembly-only entry.
- **Total one-time download: about 78 MB** (owner's limit: 100 MB). The browser keeps the model (Cache API), so it downloads once.
- **Judging a pair:** for each of the two words, the CTC forward algorithm gives how likely the audio is to be that spelling; the more likely word is what it "sounded like". A difference under 0.5 (log-likelihood) is "Hard to tell". A recording with no sound is "I didn't hear you".
- The total log-likelihood is used, not divided by word length: dividing favoured the longer spelling ("sink" heard as "think").

## Accuracy (measured)

| Test voices | Accuracy |
|---|---|
| Our natural English voices (2 voices × 2 speeds × 24 words) | 94% (90/96) |
| Synthetic espeak voices (en-US, en-GB, female, Persian) | 81% (78/96) |

Misses on natural voices: "sink" heard as "think" (all 4), "berry" as "very" (2). Synthetic voices are a weak stand-in for people, so the real test is the owner speaking. The checker is labelled "experiment… it can be wrong" on screen.

In headless Chromium, the model is ready in about 3 s from cache, and a whole try (say the word, auto-stop, check) takes about 3 s.

## The flow (one thing per screen)

1. **Result screen** of Minimal pairs: a quiet link "Check my pronunciation (experiment)".
2. **Consent** (first time only): the words they'll say, size, Wi-Fi, the microphone, privacy, "it can be wrong". Bottom: "Download (78 MB)", quiet "Not now".
3. **Downloading:** progress bar, "Getting ready…" at the end. Quiet "Back".
4. **Say the word:** the word, "Not «other word»", "Hear Mira say it". Bottom: mic "Say it", quiet "Back to your result".
5. **Recording:** stops by itself about 1 second after they stop speaking (a level meter), or at 6 seconds; they can also tap Stop. The countdown is hidden from screen readers.
6. **Verdict** (focus moves to it): ✓ "That sounded like …" / ✗ "That sounded more like …" with the mouth tip / "Hard to tell" / "I didn't hear you" / "Couldn't check that one" (an error, never blamed on the learner). Plus ▶ My voice and ▶ Mira. Bottom: after ✓ "Next word" (quiet "Try again"); otherwise "Try again" (quiet "Next word").
7. **End:** "k of n sounded right", where n counts only clear verdicts, and a list of the words with ✓ / ✗ / ? (hard to tell) / – (not checked). A reminder it can be wrong. Bottom: "Back to your result", quiet "Say them again".

Words: every word of the weakest sound pair (4 words), or one word from each sound pair (6) after a perfect round.

After the download, the page asks the browser to keep its storage (`navigator.storage.persist()`), so the model isn't cleared.

## Reviews (with screenshots of every screen, English and Persian)

Learning UX, accessibility, Persian and performance reviewers; all must-fixes are in: errors aren't shown as "didn't hear you", an honest end score with a per-word list, "Try again" first after a miss, the verdict gets focus, `lang="en"` only on the English word, focus on every stage, a hidden countdown, one status region with quarter-step progress, and more natural Persian wording.

Later (from the performance review): run the model in a Web Worker so slow phones don't freeze; a resumable download; measure memory on a low-end Android phone and an iPhone.

## Privacy

Recordings stay in memory on the device and are checked there; nothing is sent or stored. The model comes from Hugging Face. The privacy page says this.

## Open questions

- **Hosting the model:** it's downloaded from huggingface.co, which may be blocked or slow in Iran. If it fails for the owner, we can host the 66.5 MB file ourselves.
- **Next:** if it works on real voices, use it for scored speaking in Minimal pairs, and later for other sounds.
