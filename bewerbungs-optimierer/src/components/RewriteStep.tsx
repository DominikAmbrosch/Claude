import { AlertIcon, ArrowLeftIcon, ArrowRightIcon, Spinner } from './icons'

interface Props {
  rewrittenCv: string
  onChange: (v: string) => void
  loading: boolean
  error: string | null
  onRetry: () => void
  onBack: () => void
  onContinue: () => void
}

export function RewriteStep({
  rewrittenCv,
  onChange,
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
          Schritt 2 · Berufserfahrung neu formulieren
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Die fehlenden Keywords werden natürlich eingebaut, die Warnsignale behoben und Erfolge nach der
          Google-XYZ-Formel formuliert ("Erreichte X, gemessen an Y, durch Z"). Du kannst das Ergebnis unten
          direkt bearbeiten - prüfe alle Angaben auf Richtigkeit, bevor du dich damit bewirbst.
        </p>

        {loading && (
          <div className="flex items-center gap-2 py-8 justify-center text-sm text-slate-500 dark:text-slate-400">
            <Spinner />
            Berufserfahrung wird neu formuliert ...
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <textarea
            className="input h-80 font-mono text-[13px]"
            value={rewrittenCv}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>

      <div className="flex justify-between">
        <button type="button" className="btn-ghost" onClick={onBack}>
          <ArrowLeftIcon />
          Zurück
        </button>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={onRetry} disabled={loading}>
            Neu generieren
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onContinue}
            disabled={loading || !rewrittenCv || !!error}
          >
            ATS-Scan starten
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
