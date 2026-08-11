import { useEffect, useState } from 'react'
import { ApiKeySetup } from './components/ApiKeySetup'
import { Stepper } from './components/Stepper'
import { InputStep } from './components/InputStep'
import { AnalysisStep } from './components/AnalysisStep'
import { RewriteStep } from './components/RewriteStep'
import { ScanStep } from './components/ScanStep'
import { ResultStep } from './components/ResultStep'
import {
  MODELS,
  buildAnalysisPrompt,
  buildRewritePrompt,
  buildScanPrompt,
  callClaude,
  parseAnalysis,
  parseRewrite,
  parseScan,
} from './lib/claude'
import type { AnalysisResult, ScanResult, Step } from './types'

const API_KEY_STORAGE = 'bewerbungs-optimierer:api-key'
const MODEL_STORAGE = 'bewerbungs-optimierer:model'

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) ?? '')
  const [model, setModel] = useState(() => localStorage.getItem(MODEL_STORAGE) ?? MODELS[0].id)
  const [step, setStep] = useState<Step>('input')

  const [cvText, setCvText] = useState('')
  const [jobText, setJobText] = useState('')

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const [rewrittenCv, setRewrittenCv] = useState('')
  const [rewriteLoading, setRewriteLoading] = useState(false)
  const [rewriteError, setRewriteError] = useState<string | null>(null)

  const [scan, setScan] = useState<ScanResult | null>(null)
  const [finalCv, setFinalCv] = useState('')
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const [recheckScore, setRecheckScore] = useState<number | null>(null)
  const [recheckLoading, setRecheckLoading] = useState(false)
  const [recheckError, setRecheckError] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(API_KEY_STORAGE, apiKey)
  }, [apiKey])

  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE, model)
  }, [model])

  const runAnalysis = async () => {
    setAnalysisLoading(true)
    setAnalysisError(null)
    try {
      const { system, user } = buildAnalysisPrompt(cvText, jobText)
      const raw = await callClaude(apiKey, model, system, user, 2048)
      setAnalysis(parseAnalysis(raw))
    } catch (e) {
      setAnalysisError(errorMessage(e))
    } finally {
      setAnalysisLoading(false)
    }
  }

  const runRewrite = async (currentAnalysis: AnalysisResult) => {
    setRewriteLoading(true)
    setRewriteError(null)
    try {
      const { system, user } = buildRewritePrompt(cvText, jobText, currentAnalysis)
      const raw = await callClaude(apiKey, model, system, user, 4096)
      setRewrittenCv(parseRewrite(raw))
    } catch (e) {
      setRewriteError(errorMessage(e))
    } finally {
      setRewriteLoading(false)
    }
  }

  const runScan = async (currentCv: string) => {
    setScanLoading(true)
    setScanError(null)
    try {
      const { system, user } = buildScanPrompt(currentCv, jobText)
      const raw = await callClaude(apiKey, model, system, user, 4096)
      const parsed = parseScan(raw)
      setScan(parsed)
      setFinalCv(parsed.finalResume || currentCv)
    } catch (e) {
      setScanError(errorMessage(e))
    } finally {
      setScanLoading(false)
    }
  }

  const runRecheck = async () => {
    setRecheckLoading(true)
    setRecheckError(null)
    try {
      const { system, user } = buildAnalysisPrompt(finalCv, jobText)
      const raw = await callClaude(apiKey, model, system, user, 2048)
      setRecheckScore(parseAnalysis(raw).score)
    } catch (e) {
      setRecheckError(errorMessage(e))
    } finally {
      setRecheckLoading(false)
    }
  }

  const handleStartOver = () => {
    setStep('input')
    setCvText('')
    setJobText('')
    setAnalysis(null)
    setAnalysisError(null)
    setRewrittenCv('')
    setRewriteError(null)
    setScan(null)
    setFinalCv('')
    setScanError(null)
    setRecheckScore(null)
    setRecheckError(null)
  }

  const canStartAnalysis =
    cvText.trim().length > 50 && jobText.trim().length > 50 && apiKey.trim().length > 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Bewerbungs-Optimierer
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Lebenslauf und Stellenbeschreibung eingeben und in drei Schritten mit Claude gezielt
          überarbeiten: Recruiter-Analyse, Neuformulierung mit der Google-XYZ-Formel und ein
          ATS-/Hiring-Manager-Scan.
        </p>
      </header>

      <div className="mb-6">
        <ApiKeySetup apiKey={apiKey} onApiKeyChange={setApiKey} model={model} onModelChange={setModel} />
        {!apiKey && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Gib zuerst einen API-Key ein, um die Analyse starten zu können.
          </p>
        )}
      </div>

      <div className="mb-6">
        <Stepper current={step} />
      </div>

      {step === 'input' && (
        <InputStep
          cvText={cvText}
          onCvTextChange={setCvText}
          jobText={jobText}
          onJobTextChange={setJobText}
          canContinue={canStartAnalysis}
          onContinue={() => {
            setStep('analysis')
            void runAnalysis()
          }}
        />
      )}

      {step === 'analysis' && (
        <AnalysisStep
          analysis={analysis}
          loading={analysisLoading}
          error={analysisError}
          onRetry={() => void runAnalysis()}
          onBack={() => setStep('input')}
          onContinue={() => {
            if (!analysis) return
            setStep('rewrite')
            void runRewrite(analysis)
          }}
        />
      )}

      {step === 'rewrite' && (
        <RewriteStep
          rewrittenCv={rewrittenCv}
          onChange={setRewrittenCv}
          loading={rewriteLoading}
          error={rewriteError}
          onRetry={() => {
            if (analysis) void runRewrite(analysis)
          }}
          onBack={() => setStep('analysis')}
          onContinue={() => {
            setStep('scan')
            void runScan(rewrittenCv)
          }}
        />
      )}

      {step === 'scan' && (
        <ScanStep
          scan={scan}
          finalCv={finalCv}
          onFinalCvChange={setFinalCv}
          loading={scanLoading}
          error={scanError}
          onRetry={() => void runScan(rewrittenCv)}
          onBack={() => setStep('rewrite')}
          onContinue={() => setStep('result')}
        />
      )}

      {step === 'result' && (
        <ResultStep
          finalCv={finalCv}
          initialScore={analysis?.score ?? null}
          recheckScore={recheckScore}
          recheckLoading={recheckLoading}
          recheckError={recheckError}
          onRecheck={() => void runRecheck()}
          onBack={() => setStep('scan')}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  )
}
