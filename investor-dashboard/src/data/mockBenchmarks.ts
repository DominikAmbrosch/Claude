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

export type BenchmarkId = 'DAX' | 'MSCI World' | 'S&P 500' | 'Nasdaq';

const BENCHMARK_BASE: Record<BenchmarkId, number> = {
  DAX: 18500,
  'MSCI World': 3600,
  'S&P 500': 5850,
  Nasdaq: 19200,
};

export const BENCHMARK_IDS: BenchmarkId[] = ['DAX', 'MSCI World', 'S&P 500', 'Nasdaq'];

export function getBenchmarkHistory(id: BenchmarkId, days = 90): { date: string; close: number }[] {
  const rand = seededRandom(id);
  const base = BENCHMARK_BASE[id];
  let price = base * 0.94;
  const history: { date: string; close: number }[] = [];
  const today = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const drift = (rand() - 0.47) * 0.012;
    price = Math.max(1, price * (1 + drift));
    history.push({ date: d.toISOString().slice(0, 10), close: Math.round(price * 100) / 100 });
  }
  history[history.length - 1].close = base;
  return history;
}
