import type { Step } from '../types'
import { CheckIcon } from './icons'

const STEPS: { id: Step; label: string }[] = [
  { id: 'input', label: 'Eingabe' },
  { id: 'analysis', label: 'Analyse' },
  { id: 'rewrite', label: 'Neuformulierung' },
  { id: 'scan', label: 'ATS-Scan' },
  { id: 'result', label: 'Ergebnis' },
]

export function Stepper({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current)

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming'
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ' +
                (state === 'done'
                  ? 'bg-blue-600 text-white'
                  : state === 'current'
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500')
              }
            >
              {state === 'done' ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={
                state === 'upcoming'
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'font-medium text-slate-800 dark:text-slate-200'
              }
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 h-px w-6 bg-slate-200 dark:bg-slate-700" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
