import { useRef } from 'react'
import { ArrowRightIcon } from './icons'

interface Props {
  cvText: string
  onCvTextChange: (v: string) => void
  jobText: string
  onJobTextChange: (v: string) => void
  onContinue: () => void
  canContinue: boolean
}

function TextFileUpload({ onText }: { onText: (text: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onText(reader.result)
    }
    reader.readAsText(file)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      <button type="button" className="btn-ghost text-xs" onClick={() => inputRef.current?.click()}>
        .txt / .md hochladen
      </button>
    </>
  )
}

export function InputStep({
  cvText,
  onCvTextChange,
  jobText,
  onJobTextChange,
  onContinue,
  canContinue,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <label className="label mb-0" htmlFor="cv-text">
            Lebenslauf (vollständiger Text)
          </label>
          <TextFileUpload onText={onCvTextChange} />
        </div>
        <textarea
          id="cv-text"
          className="input mt-2 h-56 font-mono text-[13px]"
          placeholder="Füge hier den kompletten Text deines Lebenslaufs ein (Kontaktdaten, Berufserfahrung, Ausbildung, Skills, ...). Bei einer PDF: Text markieren, kopieren und hier einfügen."
          value={cvText}
          onChange={(e) => onCvTextChange(e.target.value)}
        />
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <label className="label mb-0" htmlFor="job-text">
            Stellenbeschreibung
          </label>
          <TextFileUpload onText={onJobTextChange} />
        </div>
        <textarea
          id="job-text"
          className="input mt-2 h-56 font-mono text-[13px]"
          placeholder="Füge hier den Text der Stellenanzeige ein, auf die du dich bewerben möchtest."
          value={jobText}
          onChange={(e) => onJobTextChange(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="btn-primary"
          disabled={!canContinue}
          onClick={onContinue}
        >
          Analyse starten
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  )
}
