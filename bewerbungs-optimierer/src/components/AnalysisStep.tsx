import type { AnalysisResult } from '../types'
import { AlertIcon, ArrowLeftIcon, ArrowRightIcon, Spinner } from './icons'

interface Props {
  analysis: AnalysisResult | null
  loading: boolean
  error: string | null
  onRetry: () => void
  onBack: () => void
  onContinue: () => void
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = (Math.max(0, Math.min(100, score)) / 100) * circumference
  const colorClass = score >= 75 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500'

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          className={colorClass}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{score}</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">Match-Score</span>
      </div>
    </div>
  )
}

export function AnalysisStep({ analysis, loading, error, onRetry, onBack, onContinue }: Props) {
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Schritt 1 · Recruiter-Analyse
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Claude verhält sich wie ein Senior-Recruiter des Unternehmens und vergleicht deinen Lebenslauf
          direkt mit der Stellenbeschreibung.
        </p>

        {loading && (
          <div className="flex items-center gap-2 py-8 justify-center text-sm text-slate-500 dark:text-slate-400">
            <Spinner />
            Analyse läuft ...
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && analysis && (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <ScoreGauge score={analysis.score} />
              <div className="flex-1">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Fehlende Keywords
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missingKeywords.length === 0 && (
                    <span className="text-sm text-slate-400">Keine erkannt.</span>
                  )}
                  {analysis.missingKeywords.map((kw, i) => (
                    <span key={i} className="badge bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Warnsignale
              </h3>
              <ul className="space-y-2">
                {analysis.warningSigns.map((w, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50/60 p-2.5 text-sm dark:border-rose-900/50 dark:bg-rose-950/20"
                  >
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    <span>
                      <span className="font-medium text-rose-700 dark:text-rose-300">{w.title}</span>
                      {w.reason && <span className="text-slate-600 dark:text-slate-400"> — {w.reason}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button type="button" className="btn-ghost" onClick={onBack}>
          <ArrowLeftIcon />
          Zurück
        </button>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={onRetry} disabled={loading}>
            Neu analysieren
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onContinue}
            disabled={loading || !analysis || !!error}
          >
            Berufserfahrung neu schreiben
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
