export type ModuleId = 'researcher' | 'model' | 'earnings' | 'portfolio' | 'tips' | 'briefing';

export interface NewsHeadline {
  id: string;
  title: string;
  source: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  url?: string;
}

export interface AnalystRating {
  firm: string;
  rating: 'Buy' | 'Hold' | 'Sell' | 'Overweight' | 'Underweight';
  priceTarget: number;
  date: string;
}

export interface CompanyEvent {
  id: string;
  title: string;
  date: string;
  type: 'Earnings' | 'Dividende' | 'M&A' | 'Guidance' | 'Sonstiges';
}

export interface FundamentalIndicators {
  peRatio: number;
  psRatio: number;
  pbRatio: number;
  debtToEquity: number;
  dividendYield: number;
  marketCap: number;
  revenueGrowthYoY: number;
  epsGrowthYoY: number;
  ebitMargin: number;
  roe: number;
}

export interface TechnicalIndicators {
  rsi14: number;
  sma50: number;
  sma200: number;
  trend: 'Aufwärtstrend' | 'Seitwärts' | 'Abwärtstrend';
  volatility30d: number;
  week52High: number;
  week52Low: number;
}

export interface StockProfile {
  ticker: string;
  isin: string;
  name: string;
  sector: string;
  country: string;
  currency: string;
  price: number;
  previousClose: number;
  changePct: number;
  news: NewsHeadline[];
  analystRatings: AnalystRating[];
  events: CompanyEvent[];
  fundamentals: FundamentalIndicators;
  technicals: TechnicalIndicators;
  history: { date: string; close: number }[];
}

export interface WatchlistItem {
  ticker: string;
  addedAt: string;
  alertAbove?: number;
  alertBelow?: number;
}

export interface ValuationInputs {
  ticker: string;
  currentPrice: number;
  peRatio: number;
  psRatio: number;
  debtToEquity: number;
  growth3y: number;
  growth5y: number;
  growth10y: number;
  wacc: number;
  marginOfSafety: number;
  epsBase: number;
  terminalGrowth: number;
  dividendPerShare: number;
  dividendGrowthRate: number;
}

export type ValuationMethod = 'dcf' | 'comparables' | 'ddm';

export interface ValuationModel {
  id: string;
  name: string;
  createdAt: string;
  inputs: ValuationInputs;
}

export interface PortfolioHolding {
  id: string;
  ticker: string;
  shares: number;
  buyPrice: number;
  buyDate: string;
  sector?: string;
  country?: string;
}

export interface PriceAlert {
  ticker: string;
  above?: number;
  below?: number;
}

export type Recommendation = 'Kaufen' | 'Halten' | 'Verkaufen';

export interface EarningsStatement {
  text: string;
  tone: 'positive' | 'warning' | 'negative';
}

export interface FinancialMetrics {
  revenue: string | null;
  ebit: string | null;
  netIncome: string | null;
  growth: string | null;
}

export interface EarningsAnalysis {
  id: string;
  createdAt: string;
  ticker?: string;
  sourceExcerpt: string;
  keyMessages: EarningsStatement[];
  metrics: FinancialMetrics;
  financialHighlights: string[];
  guidance: string[];
  managementTone: 'Optimistisch' | 'Neutral' | 'Vorsichtig' | 'Pessimistisch';
  toneScore: number;
  risks: string[];
  opportunities: string[];
  investmentTakeaway: string;
}
