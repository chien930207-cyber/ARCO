# ARCO | Musiktheorie praktisch lernen

> Dieses Paket enthält das neue Logo. Lade `index.html`, `icons/` und `site.webmanifest` gemeinsam hoch. [Bereitstellung](docs/LOGO-DEPLOYMENT.md) | [Symbolprüfung](logo-check.html).

**Verstehen, hören und selbst Musik machen.**

[繁體中文](README.md) | [English](README.en.md)

ARCO verbindet Musiktheorie mit Hörbeispielen, praktischen Übungen und Aufgaben am Instrument. Der Lernweg führt von Notenschrift und Rhythmus über Intervalle, Tonleitern, Akkorde und Modi bis zu Arrangement und fortgeschrittener Harmonik.

**100 Lektionen | 1.000 Kursfragen | 3.000 Duellfragen**

## Den passenden Einstieg finden

Beginne mit dem **Einstufungstest mit 15 Fragen ohne Zeitlimit** oder direkt bei Stufe 1. Die Fragen werden nach fünf Schwierigkeitsbereichen zufällig ausgewählt. Das Ergebnis zeigt eine empfohlene Startstufe, deine Antworten, die richtigen Antworten und Erklärungen.

Jede Lektion hat 10 Fragen. **Mit mindestens 8 richtigen Antworten wird die nächste Stufe freigeschaltet.** Offene Lektionen bleiben zum Wiederholen zugänglich. Eine Einstufung auf Stufe 40 öffnet Stufen 1–40; nach Bestehen von Stufe 40 folgt Stufe 41. Einstufungsfreigaben und tatsächlich bestandene Lektionen werden getrennt erfasst.

Ein abgeschlossener Einstufungstest lässt sich nicht einfach neu starten. Das bestätigte Zurücksetzen auf Werkseinstellungen führt zur Startauswahl zurück und löscht die lokalen ARCO-Daten.

## Lernen und anwenden

**Verstehen → Ausprobieren → Am Instrument spielen → Quiz starten**

Jede Lektion enthält Erklärungen, Beispiele, typische Fehler, synthetisierte Hörbeispiele, interaktive Übungen, Spielaufgaben, Hintergrundwissen und weiterführendes Material. Spiele auf den Tasten, gib Töne ein, markiere Rhythmusfelder oder vergleiche Arrangemententscheidungen. Falsche Kursantworten erscheinen im Fehlerheft.

Interaktive Aufgaben prüfen deine Eingaben. Aufgaben am Instrument haben Kriterien zur Selbstkontrolle; die Website nimmt dein Spiel nicht auf und bewertet keine Live-Darbietung automatisch.

## Duelle mit Freunden oder KI

Eine Person erstellt einen Raum mit vierstelliger Nummer, die andere tritt bei. Beide erhalten dieselben Fragen und dieselbe Antwortreihenfolge aus allen 100 Stufen.

Allein kannst du zwischen drei KI-Schwierigkeitsgraden wählen. Kombiniere Kapitel, einzelne Lektionen oder eigene Stufenbereiche, auch aus noch gesperrten Kursen. Die KI-Gegner arbeiten mit lokalen Regeln, nicht mit einem generativen Modell, und ändern ihre Antwort nicht nach deiner Auswahl.

Ein Duell umfasst 10 Fragen: **5 Sekunden lesen → 30 Sekunden antworten → 3 Sekunden die Lösung sehen → automatisch weiter**. Die letzte Bossfrage zählt dreifach. Punkte ergeben sich aus Schwierigkeit, Antwortzeit und der Serie richtiger Antworten.

Erklärungen erscheinen erst nach dem Duell. Du kannst Fehler oder alle 10 Fragen ansehen und deine Antworten mit den richtigen vergleichen. Duelle verändern keine Kursnoten und schalten keine Lektionen frei. Der Duellrückblick bleibt in der aktuellen Partie und wird nicht ins Kursfehlerheft übernommen.

## Sprachen und Tonnamen

Das kompakte Sprachmenü bietet **Traditionelles Chinesisch, Englisch und Deutsch**. Oberfläche, Lektionen, Fragen, Antwortmöglichkeiten, Erklärungen, praktische Aufgaben und Bedienhinweise sind in allen drei Sprachen enthalten. Die Übersetzungen sind eingebaut und auch offline verfügbar; ein Übersetzungsdienst oder API-Schlüssel ist nicht nötig.

Ein Sprachwechsel ändert weder Fragen noch Antwortreihenfolge, Auswahl, Zeitmessung oder Punktestand. Die Website verwendet durchgängig die internationalen Tonnamen **C D E F G A B**: **B entspricht dem deutschen H; B♭ entspricht dem deutschen B.** Externe Materialien und Videos behalten ihre Originalsprache.

## Nutzung und Sicherung

Öffne die Website oder die enthaltene Datei `index.html` im Browser. Konto und Installation sind nicht erforderlich. Lektionen, Einstufung, Hörbeispiele und KI-Training funktionieren lokal. Für Online-Duelle und externe Materialien brauchst du Internet.

Der Lernstand liegt im aktuellen Browser, **nicht in einem Cloud-Konto**. Exportiere in den Einstellungen eine JSON-Sicherung, bevor du Browser, Gerät oder Website-Adresse wechselst, Websitedaten löschst oder die Bereitstellung aktualisierst. Ein Import ersetzt den aktuellen Lernstand. Sprache und Duelleinstellungen sind nicht in dieser Lernsicherung enthalten.

Das Zurücksetzen löscht nach Bestätigung lokale ARCO-Fortschritte, Fehler, Einstellungen und automatische Sicherungen. Bereits exportierte JSON-Dateien bleiben erhalten.

Die Verbindung zwischen Spielern hängt von Browser und Netzwerk ab. Der Zwei-Tab-Test funktioniert nur lokal und ersetzt keine geräteübergreifende Verbindung. Beide Geräte benötigen kompatible Versionen.

## Hinweise und Rückmeldungen

Die 100 Stufen sind ARCOs eigener Lernweg, keine offizielle Prüfungsordnung. Die Einstufung empfiehlt einen Einstieg und bescheinigt keine Qualifikation. Fragen und Übersetzungen wurden nicht vollständig von unabhängigen Fachleuten geprüft.

Als Quellen dienen [musictheory.net](https://www.musictheory.net/lessons), [Open Music Theory](https://viva.pressbooks.pub/openmusictheory/) und [Ableton Learning Music](https://learningmusic.ableton.com/).

Nenne bei Fehlern bitte Stufe, Frage, Sprache, Gerät und die Schritte zum Nachstellen. Die Bilder wurden mit KI erzeugt und zeigen keinen realen Veranstaltungsort. Es wird keine neue Open-Source-Lizenz vergeben; für fremde Inhalte gelten deren Bedingungen.

## Erstellen und testen

`index.html` ist direkt veröffentlichbar. Quellmodule liegen in `src/`, Übersetzungen in `locales/translations.json`.

```sh
python build.py
node tests/translation.test.cjs
node tests/placement.test.cjs
node tests/battle_engine.test.cjs
node tests/audio_recovery.test.cjs
```

Weitere Angaben: [Sprachen und Testumfang](docs/LANGUAGES.md).
