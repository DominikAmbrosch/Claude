import type { AnalysisResult, ClaudeModel, ScanResult } from '../types'

export const MODELS: ClaudeModel[] = [
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 (empfohlen)' },
  { id: 'claude-opus-5', label: 'Claude Opus 5 (höchste Qualität)' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (schnell & günstig)' },
]

const API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

export class ClaudeApiError extends Error {}

/**
 * Calls the Claude API directly from the browser. The API key never leaves
 * the browser except in this direct request to api.anthropic.com.
 */
export async function callClaude(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  maxTokens = 4096,
): Promise<string> {
  let res: Response
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })
  } catch {
    throw new ClaudeApiError(
      'Die Anfrage an die Claude-API ist fehlgeschlagen (Netzwerkfehler). Prüfe deine Internetverbindung.',
    )
  }

  if (!res.ok) {
    let message = `Claude-API-Fehler (${res.status})`
    try {
      const body = await res.json()
      if (body?.error?.message) message = body.error.message
    } catch {
      // ignore parse failure, use generic message
    }
    if (res.status === 401) {
      message = 'Ungültiger API-Key. Bitte prüfe deinen Anthropic-API-Key.'
    }
    throw new ClaudeApiError(message)
  }

  const data = await res.json()
  const text = data?.content
    ?.filter((block: { type: string }) => block.type === 'text')
    ?.map((block: { text: string }) => block.text)
    ?.join('\n')

  if (!text) {
    throw new ClaudeApiError('Die Antwort der Claude-API enthielt keinen Text.')
  }
  return text as string
}

function extractTag(raw: string, tag: string): string {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(raw)
  return match ? match[1].trim() : ''
}

function extractAllTags(raw: string, tag: string): string[] {
  const matches = raw.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'gi'))
  return [...matches].map((m) => m[1].trim())
}

// ---------------------------------------------------------------------------
// Prompt 1: Match-Score, fehlende Keywords, Warnsignale
// ---------------------------------------------------------------------------

export function buildAnalysisPrompt(cv: string, job: string) {
  const system =
    'Du verhältst dich wie ein Senior-Recruiter des Unternehmens, das die folgende Stellenbeschreibung ' +
    'veröffentlicht hat. Du hast jahrelange Erfahrung im Screening von Lebensläufen, bist ehrlich und direkt ' +
    'und triffst deine Einschätzung ausschließlich auf Basis der vorliegenden Dokumente.'

  const user = `STELLENBESCHREIBUNG:
"""
${job}
"""

LEBENSLAUF:
"""
${cv}
"""

Analysiere meinen Lebenslauf im Vergleich zur Stellenbeschreibung und gib mir:
- einen Match-Score von 0-100,
- die 5 wichtigsten fehlenden Keywords,
- und die 3 größten Warnsignale, die ein Hiring Manager in weniger als 10 Sekunden erkennen würde.

Antworte AUSSCHLIESSLICH im folgenden Format, ohne zusätzlichen Text davor oder danach:

<analyse>
<score>Zahl zwischen 0 und 100</score>
<keywords>
<keyword>fehlendes Keyword 1</keyword>
<keyword>fehlendes Keyword 2</keyword>
<keyword>fehlendes Keyword 3</keyword>
<keyword>fehlendes Keyword 4</keyword>
<keyword>fehlendes Keyword 5</keyword>
</keywords>
<warnsignale>
<warnsignal><titel>Kurzer Titel</titel><begruendung>Warum das in Sekunden auffällt</begruendung></warnsignal>
<warnsignal><titel>Kurzer Titel</titel><begruendung>Warum das in Sekunden auffällt</begruendung></warnsignal>
<warnsignal><titel>Kurzer Titel</titel><begruendung>Warum das in Sekunden auffällt</begruendung></warnsignal>
</warnsignale>
</analyse>`

  return { system, user }
}

export function parseAnalysis(raw: string): AnalysisResult {
  const scoreMatch = /<score>\s*(\d{1,3})\s*<\/score>/i.exec(raw)
  const score = scoreMatch ? Math.max(0, Math.min(100, parseInt(scoreMatch[1], 10))) : 0

  const missingKeywords = extractAllTags(raw, 'keyword')

  const warningSigns = extractAllTags(raw, 'warnsignal').map((block) => ({
    title: extractTag(block, 'titel') || 'Warnsignal',
    reason: extractTag(block, 'begruendung'),
  }))

  return { score, missingKeywords, warningSigns, raw }
}

// ---------------------------------------------------------------------------
// Prompt 2: Berufserfahrung neu schreiben (Google-XYZ-Formel)
// ---------------------------------------------------------------------------

export function buildRewritePrompt(cv: string, job: string, analysis: AnalysisResult) {
  const system =
    'Du bist ein erfahrener Karriere-Coach und Bewerbungstexter. Du formulierst ausschließlich auf Basis ' +
    'wahrer Angaben pointierter und wirkungsvoller um. Du erfindest KEINE neuen Arbeitgeber, Titel, Aufgaben, ' +
    'Zeiträume oder Kennzahlen - du nutzt nur Informationen, die im Original-Lebenslauf bereits enthalten sind ' +
    'oder eine plausible, vom Original gedeckte Umformulierung davon sind.'

  const keywordList = analysis.missingKeywords.map((k) => `- ${k}`).join('\n') || '(keine)'
  const warningList =
    analysis.warningSigns.map((w) => `- ${w.title}: ${w.reason}`).join('\n') || '(keine)'

  const user = `STELLENBESCHREIBUNG:
"""
${job}
"""

AKTUELLER LEBENSLAUF:
"""
${cv}
"""

Aus einer vorherigen Analyse fehlen folgende Keywords:
${keywordList}

Und es wurden folgende Warnsignale erkannt:
${warningList}

Schreibe den Abschnitt "Berufserfahrung" meines Lebenslaufs neu, sodass die fehlenden Keywords - soweit durch
meine tatsächliche Erfahrung gedeckt - natürlich integriert werden und die Warnsignale verschwinden. Nutze dabei
für die Erfolge/Aufgaben wo sinnvoll möglich die Google-XYZ-Formel: "Erreichte X, gemessen an Y, durch Z".

Erfinde dabei keine neuen Fakten. Gib den KOMPLETTEN Lebenslauf zurück, wobei ausschließlich der Abschnitt
"Berufserfahrung" überarbeitet wurde - alle anderen Abschnitte (z.B. Kontaktdaten, Ausbildung, Skills) bleiben
inhaltlich unverändert.

Antworte AUSSCHLIESSLICH im folgenden Format, ohne zusätzlichen Text davor oder danach:

<lebenslauf>
Der vollständige, überarbeitete Lebenslauftext
</lebenslauf>`

  return { system, user }
}

export function parseRewrite(raw: string): string {
  const extracted = extractTag(raw, 'lebenslauf')
  return extracted || raw.trim()
}

// ---------------------------------------------------------------------------
// Prompt 3: ATS-Scan / Hiring-Manager-Scan
// ---------------------------------------------------------------------------

export function buildScanPrompt(cv: string, job: string) {
  const system =
    'Du agierst gleichzeitig als ATS-System (Bewerbermanagement-Software) und als Hiring Manager, der an einem ' +
    'Tag 200 Lebensläufe am Stück liest. Du hast pro Lebenslauf nur wenige Sekunden Zeit und überfliegst ' +
    'Dokumente, statt sie vollständig zu lesen.'

  const user = `STELLENBESCHREIBUNG:
"""
${job}
"""

ÜBERARBEITETER LEBENSLAUF:
"""
${cv}
"""

Scanne diesen Lebenslauf so, wie du es in der Praxis tun würdest. Zeige mir, welche Abschnitte übersprungen
oder nur überflogen würden (z.B. weil sie zu textlastig, generisch, unstrukturiert oder ohne erkennbaren Nutzen
formuliert sind). Formuliere diese Abschnitte anschließend so um, dass sie sofort Aufmerksamkeit erzeugen -
ohne neue Fakten zu erfinden, die nicht bereits im Text stehen.

Antworte AUSSCHLIESSLICH im folgenden Format, ohne zusätzlichen Text davor oder danach. Liste nur Abschnitte auf,
die tatsächlich ein Problem haben (kann auch leer sein, wenn alles überzeugt):

<scan>
<uebersprungen>
<abschnitt>Betroffener Abschnitt / Ausschnitt</abschnitt>
<grund>Warum das übersprungen würde</grund>
<neu>Neu formulierte Version, die sofort Aufmerksamkeit erzeugt</neu>
</uebersprungen>
<finaler_lebenslauf>Der komplette finale Lebenslauftext mit allen Verbesserungen bereits eingearbeitet</finaler_lebenslauf>
</scan>`

  return { system, user }
}

export function parseScan(raw: string): ScanResult {
  const skippedSections = extractAllTags(raw, 'uebersprungen').map((block) => ({
    section: extractTag(block, 'abschnitt'),
    reason: extractTag(block, 'grund'),
    rewritten: extractTag(block, 'neu'),
  }))

  const finalResume = extractTag(raw, 'finaler_lebenslauf')

  return { skippedSections, finalResume, raw }
}
