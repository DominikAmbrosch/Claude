# Bewerbungs-Optimierer

Eine kleine React/Vite-App, die Lebenslauf und Stellenbeschreibung entgegennimmt und sie in drei
geführten Schritten mit Claude überarbeitet - basierend auf dem folgenden Drei-Prompt-Workflow:

1. **Recruiter-Analyse** - Claude verhält sich wie ein Senior-Recruiter des Unternehmens und liefert
   einen Match-Score (0-100), die 5 wichtigsten fehlenden Keywords und die 3 größten Warnsignale.
2. **Neuformulierung** - Der Abschnitt "Berufserfahrung" wird neu geschrieben: fehlende Keywords
   werden natürlich eingebaut, Warnsignale behoben, Erfolge nach der Google-XYZ-Formel formuliert
   ("Erreichte X, gemessen an Y, durch Z").
3. **ATS-/Hiring-Manager-Scan** - Claude scannt den überarbeiteten Lebenslauf wie ein ATS-System und
   ein Hiring Manager, der 200 Lebensläufe am Stück liest, markiert Abschnitte, die übersprungen
   würden, und formuliert sie so um, dass sie sofort Aufmerksamkeit erzeugen.

Am Ende steht ein editierbarer, herunterladbarer finaler Lebenslauftext sowie optional ein erneuter
Score-Check (Vorher/Nachher).

**Wichtig:** Das Tool formuliert vorhandene, wahre Erfahrungen wirkungsvoller - es erfindet keine
neuen Fakten, Arbeitgeber, Titel oder Kennzahlen. Prüfe das Ergebnis trotzdem immer selbst auf
inhaltliche Richtigkeit, bevor du dich damit bewirbst.

## Setup

```bash
npm install
npm run dev
```

Die App läuft rein im Browser und benötigt keinen eigenen Backend-Server. Du brauchst einen
Anthropic-API-Key aus der [Anthropic Console](https://console.anthropic.com/settings/keys), den du
direkt in der App einträgst. Der Key wird ausschließlich lokal im Browser (`localStorage`)
gespeichert und nur direkt an `api.anthropic.com` gesendet.

## Nutzung

1. API-Key eintragen und Modell wählen.
2. Vollständigen Lebenslauftext und den Text der Stellenbeschreibung einfügen (Copy & Paste, z.B. aus
   einer PDF, oder als `.txt`/`.md`-Datei hochladen).
3. Durch die drei Schritte gehen. Zwischenergebnisse (überarbeiteter Lebenslauf, finaler Text) lassen
   sich jederzeit direkt in der App bearbeiten, bevor es weitergeht.
4. Finalen Lebenslauf kopieren oder als `.txt` herunterladen.

## Build

```bash
npm run build
```
