export function formatCurrency(value: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export function formatCompactCurrency(value: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number, digits = 1) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

export function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

export function formatHoldingPeriod(buyDate: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(buyDate).getTime()) / 86_400_000));
  if (days < 31) return `${days} Tag${days === 1 ? '' : 'e'}`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${months} Monat${months === 1 ? '' : 'e'}`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths === 0 ? `${years} Jahre` : `${years} J. ${remMonths} Mon.`;
}
