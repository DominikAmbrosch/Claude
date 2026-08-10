# InvestorIQ – Research & Portfolio Suite

Eine React/TypeScript-App, die vier Investor-Tools in einer einheitlichen Oberfläche
mit gemeinsamer Navigation, globalem State (Context + `localStorage`) und Dark Mode
vereint.

## Module

- **Market Researcher** – Ticker/ISIN-Suche mit Nachrichten, Analysten-Einschätzungen,
  Unternehmensmeldungen, fundamentalen & technischen Indikatoren sowie Watchlist.
- **Model Builder** – Interaktives DCF-Bewertungsmodell mit Bull/Base/Bear-Szenarien,
  Sensitivitätsanalyse und PDF-Export.
- **Earnings Reviewer** – Analysiert eingefügte Earnings-Call-Transkripte lokal per
  Keyword-/Sentiment-Heuristik (Key Messages, Guidance, Risiken/Chancen, Tone). Für
  echte Claude-API-Analyse kann ein Backend-Proxy über die Env-Variable
  `VITE_EARNINGS_ANALYSIS_ENDPOINT` angebunden werden – API-Keys dürfen aus
  Sicherheitsgründen nie im Frontend liegen.
- **Portfolio** – Depot-Verwaltung mit Allokations-Charts, Performance-Vergleich
  (DAX/MSCI World), Risikokennzahlen (Volatilität, Beta, Sharpe Ratio),
  Preis-Alarmen, What-if-Simulation und CSV/PDF-Export.

Alle Kursdaten, Nachrichten und Kennzahlen sind deterministisch generierte
Platzhalter-Daten (kein Live-Feed) – Fokus liegt auf UX/Struktur, nicht auf
Echtzeitdaten. Für echte Marktdaten lässt sich `src/data/mockStocks.ts` gegen einen
Adapter für Alpha Vantage/finnhub.io austauschen, ohne die Komponenten anzupassen.

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server
npm run build    # Typecheck + Produktions-Build
npm run lint      # Oxlint
```
