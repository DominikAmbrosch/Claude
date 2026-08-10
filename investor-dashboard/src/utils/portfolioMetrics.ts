import type { PortfolioHolding, StockProfile } from '../types';
import { getBenchmarkHistory, type BenchmarkId } from '../data/mockBenchmarks';

export interface HoldingWithProfile extends PortfolioHolding {
  profile: StockProfile;
  currentValue: number;
  costBasis: number;
  plAbs: number;
  plPct: number;
  weightPct: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPlAbs: number;
  totalPlPct: number;
  holdings: HoldingWithProfile[];
}

export function buildPortfolioSummary(holdings: PortfolioHolding[], profiles: Record<string, StockProfile>): PortfolioSummary {
  const enriched = holdings.map((h) => {
    const profile = profiles[h.ticker];
    const currentValue = (profile?.price ?? 0) * h.shares;
    const costBasis = h.buyPrice * h.shares;
    const plAbs = currentValue - costBasis;
    const plPct = costBasis === 0 ? 0 : (plAbs / costBasis) * 100;
    return { ...h, profile, currentValue, costBasis, plAbs, plPct, weightPct: 0 };
  });

  const totalValue = enriched.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCost = enriched.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPlAbs = totalValue - totalCost;
  const totalPlPct = totalCost === 0 ? 0 : (totalPlAbs / totalCost) * 100;

  const withWeights = enriched.map((h) => ({ ...h, weightPct: totalValue === 0 ? 0 : (h.currentValue / totalValue) * 100 }));

  return { totalValue, totalCost, totalPlAbs, totalPlPct, holdings: withWeights };
}

export function aggregateBy(holdings: HoldingWithProfile[], key: 'sector' | 'country'): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const h of holdings) {
    const label = (key === 'sector' ? h.sector ?? h.profile?.sector : h.country ?? h.profile?.country) ?? 'Unbekannt';
    map.set(label, (map.get(label) ?? 0) + h.currentValue);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function dailyReturns(series: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < series.length; i++) {
    returns.push((series[i] - series[i - 1]) / series[i - 1]);
  }
  return returns;
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function covariance(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  const meanA = a.slice(0, n).reduce((x, y) => x + y, 0) / n;
  const meanB = b.slice(0, n).reduce((x, y) => x + y, 0) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += (a[i] - meanA) * (b[i] - meanB);
  return sum / n;
}

export interface PerformancePoint {
  date: string;
  portfolio: number;
  benchmark: number;
}

export interface RiskMetrics {
  volatilityAnnualizedPct: number;
  beta: number;
  sharpeRatio: number;
}

export function buildPerformanceSeries(
  holdings: HoldingWithProfile[],
  benchmark: BenchmarkId,
): { series: PerformancePoint[]; risk: RiskMetrics } {
  if (holdings.length === 0 || !holdings[0].profile) {
    return { series: [], risk: { volatilityAnnualizedPct: 0, beta: 0, sharpeRatio: 0 } };
  }

  const days = holdings[0].profile.history.length;
  const benchmarkHistory = getBenchmarkHistory(benchmark, days - 1);

  const portfolioValues: number[] = [];
  for (let i = 0; i < days; i++) {
    let value = 0;
    for (const h of holdings) {
      const point = h.profile?.history[i];
      if (point) value += point.close * h.shares;
    }
    portfolioValues.push(value);
  }

  const startPortfolio = portfolioValues[0] || 1;
  const startBenchmark = benchmarkHistory[0]?.close || 1;

  const series: PerformancePoint[] = portfolioValues.map((v, i) => ({
    date: holdings[0].profile.history[i].date,
    portfolio: (v / startPortfolio) * 100,
    benchmark: ((benchmarkHistory[i]?.close ?? startBenchmark) / startBenchmark) * 100,
  }));

  const portfolioReturns = dailyReturns(portfolioValues);
  const benchmarkReturns = dailyReturns(benchmarkHistory.map((b) => b.close));

  const dailyVol = stdDev(portfolioReturns);
  const volatilityAnnualizedPct = dailyVol * Math.sqrt(252) * 100;

  const benchVariance = stdDev(benchmarkReturns) ** 2;
  const beta = benchVariance === 0 ? 1 : covariance(portfolioReturns, benchmarkReturns) / benchVariance;

  const meanDailyReturn = portfolioReturns.reduce((a, b) => a + b, 0) / (portfolioReturns.length || 1);
  const annualizedReturn = meanDailyReturn * 252;
  const riskFreeRate = 0.025;
  const sharpeRatio = volatilityAnnualizedPct === 0 ? 0 : (annualizedReturn - riskFreeRate) / (volatilityAnnualizedPct / 100);

  return { series, risk: { volatilityAnnualizedPct, beta, sharpeRatio } };
}
