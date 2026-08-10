import type { StockProfile } from '../types';

export interface SignalReason {
  text: string;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface SignalResult {
  score: number; // 0-100, higher = more attractive
  reasons: SignalReason[];
  avgTarget: number;
  upsidePct: number;
  buyRatio: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Blends analyst targets, recent news sentiment, technical momentum and
 * fundamental growth into a single 0-100 attractiveness score, plus the
 * plain-language reasons behind it. Used both to rank new opportunities
 * and to judge existing holdings.
 */
export function computeSignal(profile: StockProfile): SignalResult {
  const reasons: SignalReason[] = [];
  let score = 50;

  const avgTarget =
    profile.analystRatings.reduce((sum, r) => sum + r.priceTarget, 0) / (profile.analystRatings.length || 1);
  const upsidePct = ((avgTarget - profile.price) / profile.price) * 100;
  const buyRatio =
    profile.analystRatings.filter((r) => r.rating === 'Buy' || r.rating === 'Overweight').length /
    (profile.analystRatings.length || 1);

  const analystContribution = clamp(upsidePct * 1.4, -25, 25);
  score += analystContribution;
  if (upsidePct >= 8) {
    reasons.push({ text: `Analysten sehen im Schnitt ${upsidePct.toFixed(1)}% Kurspotenzial (Ø-Kursziel ${avgTarget.toFixed(0)} ${profile.currency})`, tone: 'positive' });
  } else if (upsidePct <= -8) {
    reasons.push({ text: `Analysten sehen im Schnitt ${Math.abs(upsidePct).toFixed(1)}% Abwärtsrisiko zum Ø-Kursziel`, tone: 'negative' });
  }
  if (buyRatio >= 0.6) {
    reasons.push({ text: `${Math.round(buyRatio * 100)}% der Analysten empfehlen Kaufen/Übergewichten`, tone: 'positive' });
  } else if (buyRatio <= 0.2) {
    reasons.push({ text: 'Nur eine Minderheit der Analysten ist derzeit bullish', tone: 'negative' });
  }

  const recentNews = profile.news.slice(0, 8);
  const positiveNews = recentNews.filter((n) => n.sentiment === 'positive').length;
  const negativeNews = recentNews.filter((n) => n.sentiment === 'negative').length;
  score += clamp((positiveNews - negativeNews) * 4, -16, 16);
  if (positiveNews - negativeNews >= 2) {
    reasons.push({ text: `${positiveNews} positive gegenüber ${negativeNews} negativen Schlagzeilen zuletzt`, tone: 'positive' });
  } else if (negativeNews - positiveNews >= 2) {
    reasons.push({ text: `${negativeNews} negative gegenüber ${positiveNews} positiven Schlagzeilen zuletzt`, tone: 'negative' });
  }

  if (profile.technicals.trend === 'Aufwärtstrend') {
    score += 12;
    reasons.push({ text: 'Technischer Trend zeigt aufwärts (Kurs über gleitenden Durchschnitten)', tone: 'positive' });
  } else if (profile.technicals.trend === 'Abwärtstrend') {
    score -= 12;
    reasons.push({ text: 'Technischer Trend zeigt abwärts (Kurs unter gleitenden Durchschnitten)', tone: 'negative' });
  }

  if (profile.technicals.rsi14 >= 70) {
    score -= 10;
    reasons.push({ text: `RSI(14) bei ${profile.technicals.rsi14} deutet auf überkaufte Lage hin`, tone: 'negative' });
  } else if (profile.technicals.rsi14 <= 30) {
    score += 10;
    reasons.push({ text: `RSI(14) bei ${profile.technicals.rsi14} deutet auf überverkaufte, ggf. günstige Lage hin`, tone: 'positive' });
  }

  const growthAvg = (profile.fundamentals.revenueGrowthYoY + profile.fundamentals.epsGrowthYoY) / 2;
  score += clamp(growthAvg * 1.1, -14, 14);
  if (growthAvg >= 8) {
    reasons.push({ text: `Solides Wachstum: Umsatz ${profile.fundamentals.revenueGrowthYoY.toFixed(1)}% / EPS ${profile.fundamentals.epsGrowthYoY.toFixed(1)}% YoY`, tone: 'positive' });
  } else if (growthAvg <= -4) {
    reasons.push({ text: `Schwaches Wachstum: Umsatz ${profile.fundamentals.revenueGrowthYoY.toFixed(1)}% / EPS ${profile.fundamentals.epsGrowthYoY.toFixed(1)}% YoY`, tone: 'negative' });
  }

  if (profile.fundamentals.debtToEquity >= 1.3) {
    score -= 5;
    reasons.push({ text: `Vergleichsweise hohe Verschuldung (D/E ${profile.fundamentals.debtToEquity.toFixed(2)})`, tone: 'negative' });
  }

  return { score: clamp(Math.round(score), 0, 100), reasons, avgTarget, upsidePct, buyRatio };
}

export type HoldingAction = 'Nachkaufen' | 'Halten' | 'Verkaufen';

const HOLDING_ACTION_STYLES: Record<HoldingAction, string> = {
  Nachkaufen: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Halten: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  Verkaufen: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

export function getHoldingActionStyle(action: HoldingAction): string {
  return HOLDING_ACTION_STYLES[action];
}

export function deriveHoldingAction(signal: SignalResult, plPct: number): { action: HoldingAction; extraReason?: SignalReason } {
  if (signal.score >= 68) return { action: 'Nachkaufen' };
  if (signal.score <= 38) return { action: 'Verkaufen' };
  if (plPct >= 40 && signal.score < 60) {
    return {
      action: 'Halten',
      extraReason: { text: `Deutlicher Buchgewinn von ${plPct.toFixed(0)}% bei nachlassendem Signal – Gewinnmitnahme im Blick behalten`, tone: 'neutral' },
    };
  }
  return { action: 'Halten' };
}

export type OpportunityTier = 'Hohe Überzeugung' | 'Solide Chance' | 'Beobachten';

const TIER_STYLES: Record<OpportunityTier, string> = {
  'Hohe Überzeugung': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  'Solide Chance': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
  Beobachten: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
};

export function getTierStyle(tier: OpportunityTier): string {
  return TIER_STYLES[tier];
}

export function deriveOpportunityTier(score: number): OpportunityTier {
  if (score >= 72) return 'Hohe Überzeugung';
  if (score >= 58) return 'Solide Chance';
  return 'Beobachten';
}
