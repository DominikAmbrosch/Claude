import type { StockProfile, NewsHeadline, AnalystRating, CompanyEvent } from '../types';

// Deterministic pseudo-random generator so the same ticker always
// produces the same placeholder dataset within a session.
function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const SECTORS = ['Technologie', 'Industrie', 'Finanzen', 'Konsumgüter', 'Gesundheit', 'Energie', 'Grundstoffe'];
const COUNTRIES = ['Deutschland', 'USA', 'Frankreich', 'Schweiz', 'Niederlande', 'Großbritannien'];
const NEWS_TEMPLATES = [
  ['positive', 'übertrifft Analystenerwartungen im Quartalsbericht'],
  ['positive', 'kündigt Aktienrückkaufprogramm an'],
  ['positive', 'gewinnt Großauftrag in neuem Wachstumsmarkt'],
  ['neutral', 'veröffentlicht Termin für nächste Hauptversammlung'],
  ['neutral', 'bestätigt Jahresprognose auf der Investorenkonferenz'],
  ['negative', 'senkt Ausblick wegen schwacher Nachfrage'],
  ['negative', 'sieht sich steigenden Rohstoffkosten gegenüber'],
  ['positive', 'kündigt strategische Partnerschaft im Bereich KI an'],
  ['negative', 'CFO kündigt überraschend Rücktritt an'],
  ['neutral', 'stellt neue Mittelfristziele auf Kapitalmarkttag vor'],
] as const;

const SOURCES = ['Reuters', 'Bloomberg', 'Handelsblatt', 'Der Aktionär', 'Finanzen.net', 'Wall Street Journal'];
const FIRMS = ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'Deutsche Bank Research', 'UBS', 'Barclays', 'Warburg Research', 'Citi'];
const RATINGS: AnalystRating['rating'][] = ['Buy', 'Hold', 'Sell', 'Overweight', 'Underweight'];

const CURATED: Record<string, Partial<StockProfile>> = {
  SAP: { name: 'SAP SE', isin: 'DE0007164600', sector: 'Technologie', country: 'Deutschland', currency: 'EUR', price: 231.4 },
  SIE: { name: 'Siemens AG', isin: 'DE0007236101', sector: 'Industrie', country: 'Deutschland', currency: 'EUR', price: 198.7 },
  SIEMENS: { name: 'Siemens AG', isin: 'DE0007236101', sector: 'Industrie', country: 'Deutschland', currency: 'EUR', price: 198.7 },
  ALV: { name: 'Allianz SE', isin: 'DE0008404005', sector: 'Finanzen', country: 'Deutschland', currency: 'EUR', price: 312.9 },
  BAS: { name: 'BASF SE', isin: 'DE000BASF111', sector: 'Grundstoffe', country: 'Deutschland', currency: 'EUR', price: 47.8 },
  DTE: { name: 'Deutsche Telekom AG', isin: 'DE0005557508', sector: 'Technologie', country: 'Deutschland', currency: 'EUR', price: 28.3 },
  VOW3: { name: 'Volkswagen AG (VZ)', isin: 'DE0007664039', sector: 'Konsumgüter', country: 'Deutschland', currency: 'EUR', price: 92.1 },
  ADS: { name: 'adidas AG', isin: 'DE000A1EWWW0', sector: 'Konsumgüter', country: 'Deutschland', currency: 'EUR', price: 224.6 },
  AAPL: { name: 'Apple Inc.', isin: 'US0378331005', sector: 'Technologie', country: 'USA', currency: 'USD', price: 231.2 },
  MSFT: { name: 'Microsoft Corp.', isin: 'US5949181045', sector: 'Technologie', country: 'USA', currency: 'USD', price: 428.5 },
  AMZN: { name: 'Amazon.com Inc.', isin: 'US0231351067', sector: 'Konsumgüter', country: 'USA', currency: 'USD', price: 198.3 },
  MBG: { name: 'Mercedes-Benz Group AG', isin: 'DE0007100000', sector: 'Konsumgüter', country: 'Deutschland', currency: 'EUR', price: 58.4 },
};

function generateHistory(rand: () => number, base: number, days = 90) {
  const history: { date: string; close: number }[] = [];
  let price = base * (0.85 + rand() * 0.1);
  const today = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const drift = (rand() - 0.48) * 0.02;
    price = Math.max(1, price * (1 + drift));
    history.push({ date: d.toISOString().slice(0, 10), close: Math.round(price * 100) / 100 });
  }
  // Anchor last point to the "current" price for consistency.
  history[history.length - 1].close = base;
  return history;
}

function generateNews(rand: () => number, name: string): NewsHeadline[] {
  const count = 5 + Math.floor(rand() * 3);
  const used = new Set<number>();
  const news: NewsHeadline[] = [];
  for (let i = 0; i < count; i++) {
    let idx = Math.floor(rand() * NEWS_TEMPLATES.length);
    while (used.has(idx) && used.size < NEWS_TEMPLATES.length) idx = Math.floor(rand() * NEWS_TEMPLATES.length);
    used.add(idx);
    const [sentiment, text] = NEWS_TEMPLATES[idx];
    const daysAgo = Math.floor(rand() * 14);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    news.push({
      id: `news-${i}`,
      title: `${name} ${text}`,
      source: SOURCES[Math.floor(rand() * SOURCES.length)],
      date: d.toISOString().slice(0, 10),
      sentiment: sentiment as NewsHeadline['sentiment'],
    });
  }
  return news.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function generateAnalystRatings(rand: () => number, price: number): AnalystRating[] {
  const count = 3 + Math.floor(rand() * 3);
  const ratings: AnalystRating[] = [];
  const usedFirms = new Set<string>();
  for (let i = 0; i < count; i++) {
    let firm = FIRMS[Math.floor(rand() * FIRMS.length)];
    while (usedFirms.has(firm) && usedFirms.size < FIRMS.length) firm = FIRMS[Math.floor(rand() * FIRMS.length)];
    usedFirms.add(firm);
    const daysAgo = Math.floor(rand() * 30);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    ratings.push({
      firm,
      rating: RATINGS[Math.floor(rand() * RATINGS.length)],
      priceTarget: Math.round(price * (0.85 + rand() * 0.35) * 100) / 100,
      date: d.toISOString().slice(0, 10),
    });
  }
  return ratings;
}

function generateEvents(rand: () => number): CompanyEvent[] {
  const types: CompanyEvent['type'][] = ['Earnings', 'Dividende', 'M&A', 'Guidance', 'Sonstiges'];
  const count = 3 + Math.floor(rand() * 2);
  const events: CompanyEvent[] = [];
  for (let i = 0; i < count; i++) {
    const daysOffset = Math.floor(rand() * 60) - 20;
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const type = types[Math.floor(rand() * types.length)];
    const titles: Record<CompanyEvent['type'], string> = {
      Earnings: 'Quartalszahlen Veröffentlichung',
      Dividende: 'Dividendenzahlung / Ex-Tag',
      'M&A': 'Übernahme-/Fusionsgerücht bestätigt',
      Guidance: 'Aktualisierung der Jahresprognose',
      Sonstiges: 'Investorentag',
    };
    events.push({ id: `evt-${i}`, title: titles[type], date: d.toISOString().slice(0, 10), type });
  }
  return events.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function getStockProfile(input: string): StockProfile {
  const key = input.trim().toUpperCase();
  const curated = CURATED[key];
  const rand = seededRandom(key || 'DEFAULT');
  const name = curated?.name ?? `${key || 'UNBEKANNT'} Corp.`;
  const price = curated?.price ?? Math.round((20 + rand() * 300) * 100) / 100;
  const previousClose = Math.round(price * (1 - (rand() - 0.5) * 0.03) * 100) / 100;

  return {
    ticker: key || 'N/A',
    isin: curated?.isin ?? `XX${Math.floor(rand() * 1e10)}`,
    name,
    sector: curated?.sector ?? SECTORS[Math.floor(rand() * SECTORS.length)],
    country: curated?.country ?? COUNTRIES[Math.floor(rand() * COUNTRIES.length)],
    currency: curated?.currency ?? 'EUR',
    price,
    previousClose,
    changePct: Math.round(((price - previousClose) / previousClose) * 10000) / 100,
    news: generateNews(rand, name),
    analystRatings: generateAnalystRatings(rand, price),
    events: generateEvents(rand),
    fundamentals: {
      peRatio: Math.round((8 + rand() * 30) * 10) / 10,
      psRatio: Math.round((0.5 + rand() * 8) * 10) / 10,
      pbRatio: Math.round((0.8 + rand() * 6) * 10) / 10,
      debtToEquity: Math.round(rand() * 150) / 100,
      dividendYield: Math.round(rand() * 5 * 100) / 100,
      marketCap: Math.round(price * (5e6 + rand() * 3e9)),
      revenueGrowthYoY: Math.round((rand() * 20 - 4) * 10) / 10,
      epsGrowthYoY: Math.round((rand() * 30 - 8) * 10) / 10,
      ebitMargin: Math.round((5 + rand() * 30) * 10) / 10,
      roe: Math.round((rand() * 35) * 10) / 10,
    },
    technicals: {
      rsi14: Math.round(20 + rand() * 60),
      sma50: Math.round(price * (0.92 + rand() * 0.12) * 100) / 100,
      sma200: Math.round(price * (0.85 + rand() * 0.2) * 100) / 100,
      trend: (['Aufwärtstrend', 'Seitwärts', 'Abwärtstrend'] as const)[Math.floor(rand() * 3)],
      volatility30d: Math.round((10 + rand() * 40) * 10) / 10,
      week52High: Math.round(price * (1.05 + rand() * 0.35) * 100) / 100,
      week52Low: Math.round(price * (0.55 + rand() * 0.3) * 100) / 100,
    },
    history: generateHistory(rand, price),
  };
}

export const POPULAR_TICKERS = Object.keys(CURATED);
