import { useState } from 'react'
import { MODELS } from '../lib/claude'

interface Props {
  apiKey: string
  onApiKeyChange: (key: string) => void
  model: string
  onModelChange: (model: string) => void
}

export function ApiKeySetup({ apiKey, onApiKeyChange, model, onModelChange }: Props) {
  const [reveal, setReveal] = useState(false)

  return (
    <div className="card p-4 space-y-3">
      <div>
        <label className="label" htmlFor="api-key">
          Anthropic API-Key
        </label>
        <div className="flex gap-2">
          <input
            id="api-key"
            className="input font-mono"
            type={reveal ? 'text' : 'password'}
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value.trim())}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="btn-secondary shrink-0"
            onClick={() => setReveal((r) => !r)}
          >
            {reveal ? 'Verbergen' : 'Anzeigen'}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Der Key wird nur lokal in deinem Browser gespeichert (localStorage) und ausschließlich
          direkt an api.anthropic.com gesendet - nie an einen anderen Server. Du erhältst einen
          Key in der{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            Anthropic Console
          </a>
          .
        </p>
      </div>

      <div>
        <label className="label" htmlFor="model">
          Modell
        </label>
        <select
          id="model"
          className="input"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
