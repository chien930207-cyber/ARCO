# ARCO | Music theory into practice

> Logo-ready package: upload `index.html`, `icons/` and `site.webmanifest` together. [Upload guide](UPLOAD.md) | [Icon check](logo-check.html).

**Turn understanding into music you can hear and play.**

[繁體中文](README.md) | [Deutsch](README.de.md)

ARCO connects music theory with listening, practical exercises and playing. Work from notation and rhythm through intervals, scales, chords, modes, arranging and advanced harmony.

**100 lessons | 1,000 course questions | 3,000 duel questions**

## Find your starting point

Take the untimed **15-question placement test**, or start directly at level 1. Questions are randomly sampled across five difficulty bands. The results show your suggested starting level, selected answers, correct answers and explanations.

Each lesson has 10 questions. **Get at least 8 right to unlock the next level.** Previously unlocked lessons remain available for review. A placement at level 40 opens levels 1–40; passing level 40 then unlocks level 41. Placement access and actual course passes are recorded separately.

A completed placement test cannot be rerolled. A confirmed factory reset returns to the initial choice and clears your local ARCO data.

## Learn, listen and try

**Understand the concept → Try it → Play it → Take the challenge**

Lessons include explanations, worked examples, common pitfalls, synthesized audio, practical input, playing tasks, trivia and reference material. Use the keyboard, enter notes, arrange rhythm cells or compare arranging choices. Course mistakes are collected in the mistake notebook for review.

Practical exercises check your input. Playing tasks use self-check criteria; the website does not record or automatically grade your live performance.

## Duels with a friend or AI

In a two-player duel, one person creates a four-digit room and the other joins. Both players receive the same questions and option order, drawn across all 100 levels.

For solo practice, choose a beginner, standard or advanced AI opponent. Select multiple chapters, individual lessons or custom level ranges, including lessons you have not unlocked. AI opponents use local rules, not a generative model, and do not change their answer in response to yours.

Each match has 10 questions: **read for 5 seconds → answer within 30 seconds → see the answer for 3 seconds → continue automatically**. The final boss question awards triple points. Scoring combines difficulty, speed and answer streaks.

Explanations appear after the match. Review mistakes or all 10 questions, with your answers alongside the correct ones. Duel results do not unlock lessons or change course scores. Duel reviews stay within the current match and are not added to the course mistake notebook.

## Languages

Open the compact language menu to select **Traditional Chinese, English or German**. The interface, lessons, questions, choices, explanations, practical tasks and operation messages are included in each language. Translations are bundled for offline use; no translation service or API key is required.

Changing language does not change question IDs, option order, selected answers, timers or scores. Note names consistently use **C D E F G A B**. In German terminology, the site's B corresponds to H, and B♭ corresponds to German B. External references and videos retain their original languages.

## Use and save your progress

Open the website or the included `index.html` in your browser. No account or installation is needed. Lessons, placement, synthesized audio and AI practice work locally; online human duels and external resources need an internet connection.

Progress is saved in the current browser, **not in a cloud account**. Before changing browser, device or website address, clearing site data or updating your deployment, export a JSON backup from Settings. Import replaces the current learning record. Language and duel preferences are separate from that learning backup.

Factory reset clears local ARCO progress, mistakes, preferences and automatic backups after confirmation. Exported JSON files are unaffected.

Human connectivity depends on browser and network conditions. The two-tab test option is local only, not a cross-device connection. Use compatible versions on both devices.

## Project and feedback

The 100 levels are ARCO's own learning route, not an official qualification. Placement is a starting-point suggestion, not a certified assessment. The question bank and translations have not had independent professional review of every item.

References include [musictheory.net](https://www.musictheory.net/lessons), [Open Music Theory](https://viva.pressbooks.pub/openmusictheory/) and [Ableton Learning Music](https://learningmusic.ableton.com/).

For a problem report, include the level, question, interface language, device and steps to reproduce it. Artwork is AI-generated, not photography of a real venue. No new open-source license is assigned; third-party material retains its own terms.

## Build

`index.html` is ready to publish. Source modules are in `src/`; translations are in `locales/translations.json`.

```sh
python build.py
node tests/translation.test.cjs
node tests/placement.test.cjs
node tests/battle_engine.test.cjs
node tests/audio_recovery.test.cjs
```

See [language and verification notes](docs/LANGUAGES.md).
