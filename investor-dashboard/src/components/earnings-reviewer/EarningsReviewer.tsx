import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/AppStore';
import { analyzeEarningsCall } from '../../utils/earningsAnalysis';
import { downloadTextFile } from '../../utils/pdfExport';
import { readTranscriptFile, SUPPORTED_TRANSCRIPT_EXTENSIONS } from '../../utils/fileImport';
import { formatDate } from '../../utils/formatters';
import { MicIcon, DownloadIcon, CopyIcon, CheckIcon, TrashIcon, UploadIcon, FileIcon, ArrowUpIcon, ArrowDownIcon } from '../icons';
import type { EarningsAnalysis } from '../../types';

const SAMPLE_TRANSCRIPT = `Guten Tag und willkommen zu unserem Earnings Call für das dritte Quartal. Unser CEO wird zunächst die strategischen Highlights vorstellen, bevor unser CFO auf die Finanzzahlen eingeht.

Wir freuen uns, ein starkes Quartal mit Umsatzwachstum von 14 Prozent gegenüber dem Vorjahr zu berichten. Der Umsatz stieg auf 8,2 Milliarden Euro, angetrieben durch eine robuste Nachfrage im Cloud-Segment. Das EBIT verbesserte sich deutlich auf 1,4 Milliarden Euro, was einer Marge von 17 Prozent entspricht. Das Nettoergebnis lag bei 980 Millionen Euro.

Das Management ist zuversichtlich für das Gesamtjahr und hebt die Guidance an: Wir erwarten nun ein Umsatzwachstum von 11 bis 13 Prozent für das Geschäftsjahr, gegenüber zuvor 9 bis 11 Prozent. Der freie Cashflow lag bei 950 Millionen Euro, ein Rekordwert für ein drittes Quartal.

Gleichzeitig sehen wir Gegenwind durch steigende Rohstoffkosten und eine anhaltende Unsicherheit in der Lieferkette, insbesondere in der Region Asien-Pazifik. Der Wettbewerbsdruck im Kernmarkt hat leicht zugenommen, was wir aktiv beobachten.

Auf der Chancenseite investieren wir verstärkt in KI-gestützte Produkte und sehen erhebliches Potenzial in neuen Wachstumsmärkten, insbesondere in Südostasien und dem Nahen Osten. Die geplante Expansion soll ab dem nächsten Quartal Früchte tragen.

Zusammenfassend: Das Management bleibt strategisch fokussiert auf Innovation und Effizienzsteigerung. Wir sind optimistisch, dass wir unsere Mittelfristziele erreichen werden, auch wenn wir die makroökonomischen Risiken weiterhin im Blick behalten.`;

const TONE_STYLES: Record<EarningsAnalysis['managementTone'], string> = {
  Optimistisch: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
  Vorsichtig: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  Pessimistisch: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

const STATEMENT_EMOJI: Record<'positive' | 'warning' | 'negative', string> = {
  positive: '✅',
  warning: '⚠️',
  negative: '📉',
};

function metricLine(label: string, value: string | null): string {
  return `- ${label}: ${value ?? 'nicht im Text gefunden'}`;
}

function buildReportText(a: EarningsAnalysis): string {
  return `EARNINGS-ANALYSE ${a.ticker ? `– ${a.ticker}` : ''}
Erstellt am: ${formatDate(a.createdAt)}
Management-Tone: ${a.managementTone} (Score: ${a.toneScore})

KEY STATEMENTS
${a.keyMessages.map((m) => `- [${m.tone}] ${m.text}`).join('\n')}

FINANZIELLE KENNZAHLEN
${metricLine('Umsatz', a.metrics.revenue)}
${metricLine('EBIT', a.metrics.ebit)}
${metricLine('Nettoergebnis', a.metrics.netIncome)}
${metricLine('Wachstum', a.metrics.growth)}

WEITERE FINANZ-ERWÄHNUNGEN
${a.financialHighlights.map((m) => `- ${m}`).join('\n')}

GUIDANCE
${a.guidance.map((m) => `- ${m}`).join('\n')}

RISIKEN
${a.risks.map((m) => `- ${m}`).join('\n')}

CHANCEN
${a.opportunities.map((m) => `- ${m}`).join('\n')}

INVESTMENT-EINSCHÄTZUNG
${a.investmentTakeaway}
`;
}

function buildReportMarkdown(a: EarningsAnalysis): string {
  const toneEmoji = { positive: '✅', warning: '⚠️', negative: '📉' } as const;
  return `# Earnings-Analyse${a.ticker ? ` – ${a.ticker}` : ''}

*Erstellt am ${formatDate(a.createdAt)} · Management-Tone: **${a.managementTone}** (Score: ${a.toneScore})*

## Key Statements
${a.keyMessages.map((m) => `- ${toneEmoji[m.tone]} ${m.text}`).join('\n')}

## Finanzielle Kennzahlen
| Kennzahl | Wert |
| --- | --- |
| Umsatz | ${a.metrics.revenue ?? '–'} |
| EBIT | ${a.metrics.ebit ?? '–'} |
| Nettoergebnis | ${a.metrics.netIncome ?? '–'} |
| Wachstum | ${a.metrics.growth ?? '–'} |

## Guidance
${a.guidance.map((m) => `- ${m}`).join('\n')}

## Risiken
${a.risks.map((m) => `- ${m}`).join('\n')}

## Chancen
${a.opportunities.map((m) => `- ${m}`).join('\n')}

## Investment-Einschätzung
${a.investmentTakeaway}
`;
}

export function EarningsReviewer() {
  const { earningsAnalyses, saveEarningsAnalysis, deleteEarningsAnalysis } = useAppStore();
  const [ticker, setTicker] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EarningsAnalysis | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previousAnalysis = useMemo(() => {
    if (!result?.ticker) return null;
    return (
      earningsAnalyses
        .filter((a) => a.ticker === result.ticker && a.id !== result.id && a.createdAt < result.createdAt)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] ?? null
    );
  }, [earningsAnalyses, result]);

  async function handleCopyMarkdown() {
    if (!result) return;
    await navigator.clipboard.writeText(buildReportMarkdown(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleFile(file: File) {
    setFileError(null);
    setFileLoading(true);
    try {
      const text = await readTranscriptFile(file);
      if (!text.trim()) {
        setFileError('Aus dieser Datei konnte kein Text extrahiert werden (evtl. gescanntes PDF ohne Textebene).');
        return;
      }
      setTranscript(text);
      setFileName(file.name);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Datei konnte nicht gelesen werden.');
    } finally {
      setFileLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleAnalyze() {
    if (!transcript.trim()) return;
    setLoading(true);
    try {
      const analysis = await analyzeEarningsCall(transcript, ticker || undefined);
      setResult(analysis);
      saveEarningsAnalysis(analysis);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Earnings Call / Meldung einfügen</h3>
          <div className="mb-3">
            <label className="label">Ticker (optional)</label>
            <input className="input" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="z.B. SAP" />
          </div>
          <label className="label">Datei hochladen</label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_TRANSCRIPT_EXTENSIONS.join(',')}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
            {fileLoading ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">Datei wird gelesen…</p>
            ) : fileName ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                <FileIcon className="h-4 w-4 flex-shrink-0" />
                {fileName}
              </p>
            ) : (
              <>
                <UploadIcon className="h-5 w-5 text-slate-400" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Datei hierher ziehen oder <span className="text-indigo-600 dark:text-indigo-400">durchsuchen</span>
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-600">{SUPPORTED_TRANSCRIPT_EXTENSIONS.join(', ')}</p>
              </>
            )}
          </div>
          {fileError && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{fileError}</p>}

          <label className="label mt-3">Transkript oder Meldungstext</label>
          <textarea
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              setFileName(null);
            }}
            rows={12}
            className="input font-mono text-xs leading-relaxed"
            placeholder="Earnings-Call-Transkript oder Text der Meldung hier einfügen…"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-primary" disabled={!transcript.trim() || loading} onClick={handleAnalyze}>
              <MicIcon className="h-4 w-4" />
              {loading ? 'Analysiere…' : 'Analysieren'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setTranscript(SAMPLE_TRANSCRIPT);
                setFileName(null);
              }}
            >
              Beispiel laden
            </button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400 dark:text-slate-600">
            Standardmäßig läuft die Analyse lokal per Heuristik (Keyword- &amp; Sentiment-Erkennung). Für echte NLP-Analyse via
            Claude API kann ein Backend-Proxy unter <code>VITE_EARNINGS_ANALYSIS_ENDPOINT</code> konfiguriert werden – der
            API-Key darf aus Sicherheitsgründen nie im Frontend liegen.
          </p>
        </div>

        {earningsAnalyses.length > 0 && (
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Frühere Analysen</h3>
            <ul className="space-y-1.5">
              {earningsAnalyses.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <button className="min-w-0 flex-1 truncate text-left text-xs text-slate-600 dark:text-slate-300" onClick={() => setResult(a)}>
                    {a.ticker ?? 'Ohne Ticker'} · {formatDate(a.createdAt)} ·{' '}
                    <span className={`badge !px-1.5 !py-0 ${TONE_STYLES[a.managementTone]}`}>{a.managementTone}</span>
                  </button>
                  <button onClick={() => deleteEarningsAnalysis(a.id)} className="btn-ghost !p-1">
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="min-w-0">
        {!result && (
          <div className="card flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center">
            <MicIcon className="mb-3 h-8 w-8 text-slate-300 dark:text-slate-700" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Füge ein Transkript ein und klicke auf „Analysieren“, um Key Messages, Guidance, Sentiment und eine
              Investment-Einschätzung zu erhalten.
            </p>
          </div>
        )}

        {result && (
          <div id="earnings-result" className="space-y-4">
            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Management-Tone {result.ticker ? `· ${result.ticker}` : ''}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`badge !text-sm ${TONE_STYLES[result.managementTone]}`}>{result.managementTone}</span>
                    {previousAnalysis && <ToneTrend current={result.toneScore} previous={previousAnalysis.toneScore} />}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={handleCopyMarkdown}>
                    {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                    {copied ? 'Kopiert!' : 'Als Markdown kopieren'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => downloadTextFile(`${result.ticker ?? 'earnings'}-analyse.txt`, buildReportText(result))}
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Report herunterladen
                  </button>
                </div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full ${result.toneScore >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, Math.abs(result.toneScore))}%`, marginLeft: result.toneScore < 0 ? `${100 - Math.min(100, Math.abs(result.toneScore))}%` : undefined }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-600">
                Sentiment-Score: {result.toneScore}
                {previousAnalysis && ` · Vorquartal: ${previousAnalysis.toneScore}`}
              </p>
            </div>

            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Key Statements</h3>
              <ul className="space-y-2">
                {result.keyMessages.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="mt-0.5 flex-shrink-0">{STATEMENT_EMOJI[m.tone]}</span>
                    {m.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Financial Highlights</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard label="Revenue" value={result.metrics.revenue} />
                <MetricCard label="EBIT" value={result.metrics.ebit} />
                <MetricCard label="Net Income" value={result.metrics.netIncome} />
                <MetricCard label="Growth" value={result.metrics.growth} />
              </div>
              {result.financialHighlights.length > 0 && (
                <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {result.financialHighlights.map((item, i) => (
                    <li key={i} className="border-l-2 border-l-indigo-500 pl-3 text-xs text-slate-500 dark:text-slate-400">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <ResultSection title="Guidance" items={result.guidance} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ResultSection title="Risiken" items={result.risks} tone="negative" />
              <ResultSection title="Chancen" items={result.opportunities} tone="positive" />
            </div>

            <div className="card border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-500/20 dark:bg-indigo-500/5">
              <h3 className="mb-2 text-sm font-semibold text-indigo-900 dark:text-indigo-300">Ist das Investment noch sinnvoll?</h3>
              <p className="text-sm leading-relaxed text-indigo-950/80 dark:text-indigo-100/80">{result.investmentTakeaway}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSection({ title, items, tone }: { title: string; items: string[]; tone?: 'positive' | 'negative' }) {
  const borderColor = tone === 'positive' ? 'border-l-emerald-500' : tone === 'negative' ? 'border-l-rose-500' : 'border-l-indigo-500';
  return (
    <div className="card p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className={`border-l-2 ${borderColor} pl-3 text-sm text-slate-600 dark:text-slate-300`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/60">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-bold ${value ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'}`}>
        {value ?? 'n/a'}
      </p>
    </div>
  );
}

function ToneTrend({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (Math.abs(diff) < 5) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" title={`Vorquartal: ${previous}`}>
        → stabil vs. Vorquartal
      </span>
    );
  }
  const improved = diff > 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${improved ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
      title={`Vorquartal: ${previous}`}
    >
      {improved ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
      {improved ? 'verbessert' : 'verschlechtert'} vs. Vorquartal
    </span>
  );
}
