import type { EarningsAnalysis, EarningsStatement, FinancialMetrics } from '../types';

const POSITIVE_WORDS = [
  'stark', 'starkes', 'starken', 'wachstum', 'rekord', 'übertroffen', 'übertrifft', 'optimistisch',
  'zuversichtlich', 'robust', 'erfolgreich', 'beschleunigt', 'verbessert', 'solide', 'outperform',
  'record', 'strong', 'growth', 'exceeded', 'confident', 'accelerat', 'improv', 'raise', 'raised',
];
const NEGATIVE_WORDS = [
  'rückgang', 'schwäche', 'schwach', 'herausfordernd', 'unsicherheit', 'verlust', 'enttäuschend',
  'gegenwind', 'verfehlt', 'reduziert', 'sinkende', 'belastet', 'risiko', 'decline', 'weak', 'miss',
  'missed', 'headwind', 'challenging', 'lower', 'cut', 'disappoint', 'uncertain',
];
const FINANCIAL_KEYWORDS = [
  'umsatz', 'revenue', 'ebit', 'ebitda', 'gewinn', 'profit', 'marge', 'margin', 'cashflow',
  'free cash flow', 'eps', 'dividende', 'dividend', 'nettoergebnis', 'net income', 'operating income',
];
const GUIDANCE_KEYWORDS = [
  'guidance', 'prognose', 'ausblick', 'erwarten wir', 'we expect', 'rechnen mit', 'planen', 'outlook',
  'zielsetzung', 'geschäftsjahr', 'fiscal year', 'nächsten quartal', 'next quarter', 'full year',
];
const RISK_KEYWORDS = [
  'risiko', 'risk', 'unsicherheit', 'uncertainty', 'herausforderung', 'challenge', 'gegenwind',
  'headwind', 'inflation', 'geopolitisch', 'geopolitical', 'lieferkette', 'supply chain', 'regulierung',
  'regulatory', 'wettbewerbsdruck', 'competitive pressure',
];
const OPPORTUNITY_KEYWORDS = [
  'chance', 'opportunity', 'potenzial', 'potential', 'wachstumsmarkt', 'growth market', 'expansion',
  'innovation', 'neue märkte', 'new markets', 'investition', 'investment', 'ki', 'ai', 'digitalisierung',
];
const MANAGEMENT_KEYWORDS = [
  'ceo', 'cfo', 'management', 'vorstand', 'strategie', 'strategy', 'fokus', 'focus', 'prioritä',
  'priorit', 'investieren', 'invest',
];

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);
}

function containsAny(sentence: string, keywords: string[]): boolean {
  const lower = sentence.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function scoreSentimentWords(text: string): { positive: number; negative: number } {
  const lower = text.toLowerCase();
  let positive = 0;
  let negative = 0;
  for (const w of POSITIVE_WORDS) {
    const matches = lower.match(new RegExp(w, 'g'));
    if (matches) positive += matches.length;
  }
  for (const w of NEGATIVE_WORDS) {
    const matches = lower.match(new RegExp(w, 'g'));
    if (matches) negative += matches.length;
  }
  return { positive, negative };
}

function pickTop(sentences: string[], keywords: string[], limit: number): string[] {
  const matched = sentences.filter((s) => containsAny(s, keywords));
  const unique = Array.from(new Set(matched));
  return unique.slice(0, limit);
}

function sentenceTone(sentence: string): EarningsStatement['tone'] {
  const { positive, negative } = scoreSentimentWords(sentence);
  if (negative > positive) return 'negative';
  if (positive > 0 && positive >= negative) return 'positive';
  return 'warning';
}

function tagStatements(sentences: string[]): EarningsStatement[] {
  return sentences.map((text) => ({ text, tone: sentenceTone(text) }));
}

const METRIC_UNIT = '(?:Milliarden|Mrd\\.?|Millionen|Mio\\.?|billion|bn|million|mn)';
const CURRENCY = '(?:€|EUR|USD|\\$)?';

function extractMetric(text: string, keywords: string[]): string | null {
  // Word-boundaried keyword (so "umsatz" doesn't match inside "Umsatzwachstum") and a
  // mandatory magnitude unit (so it doesn't grab an unrelated bare number/percentage).
  const pattern = new RegExp(
    `\\b(?:${keywords.join('|')})\\b[^.]{0,50}?${CURRENCY}\\s*(\\d+(?:[.,]\\d+)?)\\s*(${METRIC_UNIT})\\s*${CURRENCY}`,
    'i',
  );
  const match = text.match(pattern);
  if (!match) return null;
  const [, value, unit] = match;
  return `${value} ${unit.replace(/\.$/, '')}`;
}

function extractGrowthMetric(text: string): string | null {
  const pattern = /(?:wachstum|growth|gewachsen|grew|stieg|increased)[^.]{0,40}?(\d+(?:[.,]\d+)?)\s*(?:%|prozent|percent)/i;
  const match = text.match(pattern);
  return match ? `${match[1]}%` : null;
}

function extractFinancialMetrics(text: string): FinancialMetrics {
  return {
    revenue: extractMetric(text, ['umsatz', 'erlöse', 'revenue', 'net sales']),
    ebit: extractMetric(text, ['ebit', 'operatives ergebnis', 'operating income']),
    netIncome: extractMetric(text, ['nettoergebnis', 'jahresüberschuss', 'net income', 'nettogewinn']),
    growth: extractGrowthMetric(text),
  };
}

/**
 * Local heuristic NLP fallback (no external calls, works fully offline).
 * If VITE_EARNINGS_ANALYSIS_ENDPOINT is configured, that endpoint (e.g. a
 * backend proxy that calls the Claude API with a securely stored key) is
 * used instead — API keys must never be embedded in frontend code.
 */
function analyzeLocally(transcript: string, ticker?: string): EarningsAnalysis {
  const sentences = splitSentences(transcript);
  const { positive, negative } = scoreSentimentWords(transcript);
  const toneScore = positive + negative === 0 ? 0 : Math.round(((positive - negative) / (positive + negative)) * 100);

  let managementTone: EarningsAnalysis['managementTone'] = 'Neutral';
  if (toneScore > 35) managementTone = 'Optimistisch';
  else if (toneScore > 8) managementTone = 'Neutral';
  else if (toneScore > -25) managementTone = 'Vorsichtig';
  else managementTone = 'Pessimistisch';

  const financialHighlights = pickTop(sentences, FINANCIAL_KEYWORDS, 6);
  const guidance = pickTop(sentences, GUIDANCE_KEYWORDS, 5);
  const risks = pickTop(sentences, RISK_KEYWORDS, 5);
  const opportunities = pickTop(sentences, OPPORTUNITY_KEYWORDS, 5);
  const keyMessages = pickTop(sentences, MANAGEMENT_KEYWORDS, 6);

  const fallbackMessages = sentences
    .filter((s) => !keyMessages.includes(s))
    .sort((a, b) => b.length - a.length)
    .slice(0, Math.max(0, 4 - keyMessages.length));

  let investmentTakeaway: string;
  if (managementTone === 'Optimistisch' && opportunities.length >= risks.length) {
    investmentTakeaway =
      'Der Ton des Managements ist überwiegend positiv und Chancen überwiegen die genannten Risiken. Die Aussagen stützen tendenziell die Investmentthese — dennoch sollten Bewertung (siehe Model Builder) und Peer-Vergleich separat geprüft werden.';
  } else if (managementTone === 'Pessimistisch' || risks.length > opportunities.length + 1) {
    investmentTakeaway =
      'Der Ton ist verhalten bis negativ und Risiken werden häufiger thematisiert als Chancen. Eine kritische Neubewertung der Position und ein Abgleich mit dem Fair Value im Model Builder werden empfohlen.';
  } else {
    investmentTakeaway =
      'Gemischtes Bild: Weder klar positive noch klar negative Signale überwiegen. Die Position sollte beobachtet werden; ein Blick auf konkrete Kennzahlen im Market Researcher kann zusätzliche Klarheit schaffen.';
  }

  return {
    id: `analysis-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ticker,
    sourceExcerpt: transcript.slice(0, 400),
    keyMessages: tagStatements(keyMessages.length ? keyMessages : fallbackMessages),
    metrics: extractFinancialMetrics(transcript),
    financialHighlights: financialHighlights.length ? financialHighlights : ['Keine expliziten Finanzkennzahlen im Text gefunden.'],
    guidance: guidance.length ? guidance : ['Keine explizite Guidance im Text gefunden.'],
    managementTone,
    toneScore,
    risks: risks.length ? risks : ['Keine expliziten Risiken im Text erwähnt.'],
    opportunities: opportunities.length ? opportunities : ['Keine expliziten Chancen im Text erwähnt.'],
    investmentTakeaway,
  };
}

export async function analyzeEarningsCall(transcript: string, ticker?: string): Promise<EarningsAnalysis> {
  const endpoint = import.meta.env.VITE_EARNINGS_ANALYSIS_ENDPOINT as string | undefined;

  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, ticker }),
      });
      if (response.ok) {
        const data = await response.json();
        return {
          ...data,
          id: data.id ?? `analysis-${Date.now()}`,
          createdAt: new Date().toISOString(),
          metrics: data.metrics ?? { revenue: null, ebit: null, netIncome: null, growth: null },
          keyMessages: Array.isArray(data.keyMessages)
            ? data.keyMessages.map((m: unknown) => (typeof m === 'string' ? { text: m, tone: 'warning' } : m))
            : [],
        };
      }
    } catch {
      // fall through to local heuristic on any network/endpoint failure
    }
  }

  return analyzeLocally(transcript, ticker);
}
