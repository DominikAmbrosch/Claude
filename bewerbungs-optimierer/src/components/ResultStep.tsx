import { useState } from 'react'
import { AlertIcon, ArrowLeftIcon, CheckIcon, Spinner } from './icons'

interface Props {
  finalCv: string
  initialScore: number | null
  recheckScore: number | null
  recheckLoading: boolean
  recheckError: string | null
  onRecheck: () => void
  onBack: () => void
  onStartOver: () => void
}

export function ResultStep({
  finalCv,
  initialScore,
  recheckScore,
  recheckLoading,
  recheckError,
  onRecheck,
  onBack,
  onStartOver,
}: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(finalCv)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handleDownload = () => {
    const blob = new Blob([finalCv], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lebenslauf-optimiert.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
        Prüfe den finalen Text sorgfältig: Alle Angaben (Zahlen, Titel, Zeiträume, Ergebnisse) müssen
        wahrheitsgemäß sein, bevor du dich damit bewirbst.
      </div>

      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Dein optimierter Lebenslauf
          </h2>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={handleCopy}>
              {copied ? (
                <>
                  <CheckIcon />
                  Kopiert
                </>
              ) : (
                'In Zwischenablage kopieren'
              )}
            </button>
            <button type="button" className="btn-primary" onClick={handleDownload}>
              Als .txt herunterladen
            </button>
          </div>
        </div>
        <textarea readOnly className="input h-96 font-mono text-[13px]" value={finalCv} />
      </div>

      <div className="card p-4">
        <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Match-Score erneut prüfen
        </h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Führt Prompt 1 (Recruiter-Analyse) noch einmal auf dem finalen Text aus, um die Verbesserung
          gegenüber dem Originallebenslauf zu zeigen.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          {initialScore !== null && (
            <div className="text-sm">
              <span className="text-slate-500 dark:text-slate-400">Vorher: </span>
              <span className="font-semibold">{initialScore}</span>
            </div>
          )}
          {recheckLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Spinner />
              Prüfe erneut ...
            </div>
          )}
          {!recheckLoading && recheckScore !== null && (
            <div className="text-sm">
              <span className="text-slate-500 dark:text-slate-400">Nachher: </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {recheckScore}
              </span>
            </div>
          )}
          {!recheckLoading && recheckError && (
            <div className="flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400">
              <AlertIcon className="h-4 w-4" />
              {recheckError}
            </div>
          )}
          <button type="button" className="btn-secondary" onClick={onRecheck} disabled={recheckLoading}>
            Score erneut prüfen
          </button>
        </div>
      </div>

      <div className="flex justify-between">
        <button type="button" className="btn-ghost" onClick={onBack}>
          <ArrowLeftIcon />
          Zurück
        </button>
        <button type="button" className="btn-secondary" onClick={onStartOver}>
          Neues Dokument starten
        </button>
      </div>
    </div>
  )
}
