export type Step = 'input' | 'analysis' | 'rewrite' | 'scan' | 'result'

export interface WarningSign {
  title: string
  reason: string
}

export interface AnalysisResult {
  score: number
  missingKeywords: string[]
  warningSigns: WarningSign[]
  raw: string
}

export interface SkippedSection {
  section: string
  reason: string
  rewritten: string
}

export interface ScanResult {
  skippedSections: SkippedSection[]
  finalResume: string
  raw: string
}

export interface ClaudeModel {
  id: string
  label: string
}
