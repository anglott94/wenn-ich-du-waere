# Wenn ich du wäre – PWA Prototyp

Ein mobiler Prototyp für das Partyspiel „Wenn ich du wäre“.

## Enthalten
- Bar/Club- und Restaurant-Modus
- Spieler hinzufügen
- Punkteziel 5; Punktestände dürfen ins Minus fallen
- Eigene Aufgabe oder App-Vorschlag
- 1× Veto pro Spieler
- 1× Neue Aufgabe pro Spieler
- Geheime Fairness-Abstimmung bei Verweigerung
- Backfire für den Aufgabensteller bei zu harter Aufgabe
- „Dann mach du es“-Topf für alle Stimmen „war nicht zu hart“
- Wer daraus gezogen wird und die Aufgabe anschließend verweigert, verliert 2 Punkte
- Gewinner und klarer Verlierer
- Verlierer-Einsatz
- Lokale Speicherung
- Installierbare/offline-fähige PWA

## Lokal starten
Service Worker funktionieren nicht zuverlässig über `file://`. Starte deshalb einen kleinen lokalen Webserver:

```bash
python -m http.server 8080
```

Dann im Browser öffnen:

`http://localhost:8080`

## GitHub Pages
Dieses Repository ist ohne Build-Schritt bereit für GitHub Pages. Unter **Settings → Pages** die Quelle **Deploy from a branch**, den Branch **main** und den Ordner **/(root)** auswählen. Die relative Pfadführung in Manifest, Service Worker und Icons funktioniert auch unter `https://BENUTZERNAME.github.io/wenn-ich-du-waere/`.

## Installation als PWA
Die veröffentlichte HTTPS-Adresse auf dem iPhone in Safari öffnen, **Teilen → Zum Home-Bildschirm → Hinzufügen** wählen. In Chrome/Edge erscheint auf unterstützten Geräten eine Installationsoption. Spielstände liegen nur lokal im jeweiligen Browser/Gerät; sie synchronisieren sich nicht zwischen Handys.
