# Full-site language release

ARCO 2.5.0 is based on the user-supplied `index (1).html` (the 2.4.2 website). It adds complete bundled English and German display translations alongside the original Traditional Chinese.

## Scope

The localized content includes all 100 lessons, chapter and lesson names, summaries, explanations, worked examples, pitfalls, trivia, playing tasks, interactive exercise instructions, 1,000 course question records, 3,000 duel question records, options, feedback and answer explanations. The duel bank includes copies of the course questions; these counts must not be presented as 4,000 distinct concepts.

Interface coverage includes welcome choices, placement, course access, the mistake notebook, settings, import/export and reset confirmations, audio messages, room and battle states, countdowns, score labels, result summaries, accessible names, input placeholders and image descriptions. Technical identifiers, player-entered names, URLs, musical symbols and the language names in the selector are not translated as prose.

The complete lookup is embedded in `index.html`. There is no runtime translation service and no requirement for an API key. External textbooks and videos are not mirrored or translated; they retain their original language and terms.

## Content integrity

In the v2.5.0 language release, the original Chinese data and core learning/game scripts were retained. The current gold-r3 package changes only the logo renderer and document logo metadata; all learning, audio, visual-scene, language, course-data and duel modules match the delivered v2.5.0 files byte-for-byte. See `docs/logo-preservation.json` for the current hashes.

Translations act on displayed text nodes and accessible attributes. Source text is kept separately so a language change does not translate an already translated string or alter answer indices. Questions and correct answers continue to use their canonical source data. The existing compact language menu and NEW tags remain.

International note names C D E F G A B are retained in every language. For German readers, international B means H, while international B-flat means German B. This avoids changing the identity of pitches, sound playback or answer keys.

The learning key stays `arco.learning.visual.v1`, and the language preference stays `arco.locale.v1`. No update-time reset is added. Back up before deployment; switching device, browser, origin or local-file location may require an explicit import.

## Verification

The following describes the baseline v2.5.0 language-release checks. For tests rerun in this logo package, see `docs/logo-verification.json`; an icon update does not constitute a new independent linguistic audit.

- Translation lookup checks cover 8,861 distinct Chinese content strings extracted from both data banks.
- All 4,000 course/duel question records are checked for translated option collisions. The four choices remain distinct wherever the source choices differ.
- Parameterized translation placeholders are checked against the source.
- Both English and German are traversed through all 100 lesson pages, including practical exercise success/failure states, accessible labels and expanded supplementary content.
- Placement and course-result workflows check chosen answers, unknown answers, result reviews, quiz feedback and the mistake notebook. Switching language during a placement test preserves the complete run state.
- Full ten-question AI and two-tab human duels use real timers and BroadcastChannel, including a 30-second timeout, automatic transitions, the final boss and deferred reviews. The language switch preserves question ID, option order, countdown and scores.
- Layout checks cover 320, 390, 768, 1024 and 1440 pixel widths for home, catalog, lesson and duel-lobby views in both languages.
- Existing placement, battle-engine and audio-recovery unit tests are retained.

The browser runner injects the real built page into Chromium with a separate in-memory storage fixture because native navigation is restricted in this environment. The fixture is confined to test scripts and is not part of the website. These tests do not establish real browser-restart persistence, production GitHub Pages deployment, Safari/iOS compatibility, real audio output on every device or cross-device WebRTC connectivity.

Coverage and structural checks are not independent professional linguistic review or music-teacher review of every item. The Chinese source's framing is retained rather than silently rewritten. Report a translation issue with the language, lesson or question, source text and suggested wording.

## Editing

Edit `locales/translations.json` for exact text pairs and parameterized templates. `src/i18n.js` handles composed interface messages and the language menu. The English and German values are columns 0 and 1. Preserve each source key and all `{0}`-style placeholders.

Run `python build.py`, followed by `node tests/translation.test.cjs`. Do not change question IDs, canonical correct-answer indices or storage keys when editing translations.

Browser test scripts require Python Playwright and Chromium. Adjust the explicit executable path in the scripts to match the local environment. They are optional verification tools, not deployment dependencies.
