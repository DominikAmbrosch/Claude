import { useMemo, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAppStore } from '../../store/AppStore';
import { getStockProfile, POPULAR_TICKERS } from '../../data/mockStocks';
import { formatCurrency, formatCompactCurrency, formatDate, formatPercent } from '../../utils/formatters';
import { SearchIcon, StarIcon, ArrowUpIcon, ArrowDownIcon, CalculatorIcon } from '../icons';
import type { NewsHeadline } from '../../types';

const SENTIMENT_STYLES: Record<NewsHeadline['sentiment'], string> = {
  positive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
  negative: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

const SENTIMENT_LABEL: Record<NewsHeadline['sentiment'], string> = {
  positive: 'Positiv',
  neutral: 'Neutral',
  negative: 'Negativ',
};

const RATING_STYLES: Record<string, string> = {
  Buy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Overweight: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Hold: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  Sell: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  Underweight: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

export function MarketResearcher() {
  const [query, setQuery] = useState('SAP');
  const [ticker, setTicker] = useState('SAP');
  const { watchlist, addToWatchlist, removeFromWatchlist, requestOpenInModelBuilder } = useAppStore();

  const profile = useMemo(() => getStockProfile(ticker), [ticker]);
  const isWatched = watchlist.some((w) => w.ticker === profile.ticker);

  const avgTarget = useMemo(() => {
    if (profile.analystRatings.length === 0) return 0;
    return profile.analystRatings.reduce((sum, r) => sum + r.priceTarget, 0) / profile.analystRatings.length;
  }, [profile]);

  const buyCount = profile.analystRatings.filter((r) => r.rating === 'Buy' || r.rating === 'Overweight').length;
  const consensus = buyCount / profile.analystRatings.length >= 0.5 ? 'Buy' : buyCount === 0 ? 'Sell' : 'Hold';

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) setTicker(query.trim());
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_1fr]">
      {/* Watchlist sidebar */}
      <div className="order-2 xl:order-1">
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Watchlist</h3>
          {watchlist.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">Noch keine Aktien gespeichert.</p>
          )}
          <ul className="space-y-1">
            {watchlist.map((w) => (
              <li key={w.ticker}>
                <button
                  onClick={() => {
                    setTicker(w.ticker);
                    setQuery(w.ticker);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    w.ticker === profile.ticker
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="font-medium">{w.ticker}</span>
                  <StarIcon
                    filled
                    className="h-4 w-4 flex-shrink-0 text-amber-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(w.ticker);
                    }}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card mt-4 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Beliebte Werte</h3>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_TICKERS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTicker(t);
                  setQuery(t);
                }}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="order-1 min-w-0 space-y-6 xl:order-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ISIN oder Ticker eingeben (z.B. SAP, Siemens, AAPL)…"
              className="input pl-9"
            />
          </div>
          <button type="submit" className="btn-primary">
            Analysieren
          </button>
        </form>

        {/* Header card */}
        <div className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile.name}</h2>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {profile.ticker}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {profile.isin} · {profile.sector} · {profile.country}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(profile.price, profile.currency)}</p>
                <p
                  className={`flex items-center justify-end gap-1 text-sm font-medium ${
                    profile.changePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {profile.changePct >= 0 ? <ArrowUpIcon className="h-3.5 w-3.5" /> : <ArrowDownIcon className="h-3.5 w-3.5" />}
                  {formatPercent(profile.changePct)}
                </p>
              </div>
              <button
                onClick={() => (isWatched ? removeFromWatchlist(profile.ticker) : addToWatchlist(profile.ticker))}
                className={isWatched ? 'btn-secondary' : 'btn-primary'}
                title={isWatched ? 'Von Watchlist entfernen' : 'Zur Watchlist hinzufügen'}
              >
                <StarIcon filled={isWatched} className="h-4 w-4" />
                {isWatched ? 'Gespeichert' : 'Watchlist'}
              </button>
              <button className="btn-secondary" onClick={() => requestOpenInModelBuilder(profile.ticker)}>
                <CalculatorIcon className="h-4 w-4" />
                Bewerten
              </button>
            </div>
          </div>

          <div className="mt-4 h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profile.history}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value), profile.currency)}
                  labelFormatter={(label) => formatDate(label as string)}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="close" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-center text-xs text-slate-400 dark:text-slate-600">Kursverlauf, letzte 90 Tage (simuliert)</p>
        </div>

        {/* Zwei-Minuten-Zusammenfassung */}
        <div className="card border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-500/20 dark:bg-indigo-500/5">
          <h3 className="mb-2 text-sm font-semibold text-indigo-900 dark:text-indigo-300">2-Minuten-Zusammenfassung</h3>
          <p className="text-sm leading-relaxed text-indigo-950/80 dark:text-indigo-100/80">
            <strong>{profile.name}</strong> notiert bei {formatCurrency(profile.price, profile.currency)} (
            {formatPercent(profile.changePct)} vs. Vortag). Der Analysten-Konsens liegt bei{' '}
            <strong>{consensus}</strong> mit einem durchschnittlichen Kursziel von {formatCurrency(avgTarget, profile.currency)} (
            {formatPercent(((avgTarget - profile.price) / profile.price) * 100)} Potenzial). Der technische Trend ist aktuell{' '}
            <strong>{profile.technicals.trend}</strong> bei einem RSI(14) von {profile.technicals.rsi14}. Fundamental notiert die
            Aktie bei einem KGV von {profile.fundamentals.peRatio} und einer EBIT-Marge von {profile.fundamentals.ebitMargin}%.
            Zuletzt dominierten {profile.news.filter((n) => n.sentiment === 'positive').length} positive gegenüber{' '}
            {profile.news.filter((n) => n.sentiment === 'negative').length} negativen Schlagzeilen.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* News */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Aktuelle Nachrichten</h3>
            <ul className="space-y-3">
              {profile.news.map((n) => (
                <li key={n.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-700 dark:text-slate-200">{n.title}</p>
                    <span className={`badge flex-shrink-0 ${SENTIMENT_STYLES[n.sentiment]}`}>{SENTIMENT_LABEL[n.sentiment]}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {n.source} · {formatDate(n.date)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Analyst ratings */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Analysten-Einschätzungen</h3>
            <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
              <span className="text-xs text-slate-500 dark:text-slate-400">Ø Kursziel</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(avgTarget, profile.currency)}</span>
            </div>
            <ul className="space-y-2.5">
              {profile.analystRatings.map((r, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{r.firm}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(r.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900 dark:text-white">{formatCurrency(r.priceTarget, profile.currency)}</p>
                    <span className={`badge ${RATING_STYLES[r.rating]}`}>{r.rating}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Fundamentals */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Fundamentale Indikatoren</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Metric label="KGV" value={profile.fundamentals.peRatio.toString()} />
              <Metric label="KUV" value={profile.fundamentals.psRatio.toString()} />
              <Metric label="KBV" value={profile.fundamentals.pbRatio.toString()} />
              <Metric label="Verschuldung (D/E)" value={profile.fundamentals.debtToEquity.toString()} />
              <Metric label="Dividendenrendite" value={`${profile.fundamentals.dividendYield}%`} />
              <Metric label="Marktkap." value={formatCompactCurrency(profile.fundamentals.marketCap, profile.currency)} />
              <Metric label="Umsatzwachstum YoY" value={formatPercent(profile.fundamentals.revenueGrowthYoY)} />
              <Metric label="EPS-Wachstum YoY" value={formatPercent(profile.fundamentals.epsGrowthYoY)} />
              <Metric label="EBIT-Marge" value={`${profile.fundamentals.ebitMargin}%`} />
              <Metric label="ROE" value={`${profile.fundamentals.roe}%`} />
            </dl>
          </div>

          {/* Technicals */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Technische Indikatoren</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Metric label="RSI (14)" value={profile.technicals.rsi14.toString()} />
              <Metric label="SMA 50" value={formatCurrency(profile.technicals.sma50, profile.currency)} />
              <Metric label="SMA 200" value={formatCurrency(profile.technicals.sma200, profile.currency)} />
              <Metric label="Trend" value={profile.technicals.trend} />
              <Metric label="Volatilität (30T)" value={`${profile.technicals.volatility30d}%`} />
              <Metric label="52W Hoch / Tief" value={`${formatCurrency(profile.technicals.week52High, profile.currency)} / ${formatCurrency(profile.technicals.week52Low, profile.currency)}`} />
            </dl>
          </div>
        </div>

        {/* Events */}
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Wichtige Unternehmensmeldungen</h3>
          <ul className="space-y-2">
            {profile.events.map((e) => (
              <li key={e.id} className="flex items-center gap-3 text-sm">
                <span className="w-24 flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatDate(e.date)}</span>
                <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{e.type}</span>
                <span className="text-slate-700 dark:text-slate-200">{e.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}
