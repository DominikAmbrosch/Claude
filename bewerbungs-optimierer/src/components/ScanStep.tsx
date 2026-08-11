import type { ScanResult } from '../types'
import { AlertIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon, Spinner } from './icons'

interface Props {
  scan: ScanResult | null
  finalCv: string
  onFinalCvChange: (v: string) => void
  loading: boolean
  error: string | null
  onRetry: () => void
  onBack: () => void
  onContinue: () => void
}

export function ScanStep({
  scan,
  finalCv,
  onFinalCvChange,
  loading,
  error,
  onRetry,
  onBack,
  onContinue,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Schritt 3 · ATS- &amp; Hiring-Manager-Scan
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Claude scannt den überarbeiteten Lebenslauf wie ein ATS-System und ein Hiring Manager, der 200
          Lebensläufe am Stück liest, und formuliert Abschnitte um, die sonst übersprungen würden.
        </p>

        {loading && (
          <div className="flex items-center gap-2 py-8 justify-center text-sm text-slate-500 dark:text-slate-400">
            <Spinner />
            Scan läuft ...
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && scan && (
          <div className="space-y-3">
            {scan.skippedSections.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                <CheckIcon className="h-4 w-4 shrink-0" />
                Keine übersprungenen Abschnitte erkannt.
              </div>
            )}
            {scan.skippedSections.map((s, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <AlertIcon className="h-4 w-4 shrink-0 text-amber-500" />
                  {s.section || 'Abschnitt'}
                </div>
                {s.reason && (
                  <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{s.reason}</p>
                )}
                {s.rewritten && (
                  <div className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {s.rewritten}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && !error && scan && (
        <div className="card p-4">
          <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
            Finaler Lebenslauf
          </h2>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            Alle Verbesserungen sind bereits eingearbeitet. Bearbeite den Text bei Bedarf und prüfe ihn
            sorgfältig auf Richtigkeit, bevor du dich bewirbst.
          </p>
          <textarea
            className="input h-80 font-mono text-[13px]"
            value={finalCv}
            onChange={(e) => onFinalCvChange(e.target.value)}
          />
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" className="btn-ghost" onClick={onBack}>
          <ArrowLeftIcon />
          Zurück
        </button>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={onRetry} disabled={loading}>
            Neu scannen
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onContinue}
            disabled={loading || !scan || !!error}
          >
            Zum Ergebnis
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
