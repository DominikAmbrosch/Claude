import { useMemo } from 'react';
import { useAppStore } from '../../store/AppStore';
import { getStockProfile, POPULAR_TICKERS } from '../../data/mockStocks';
import { BENCHMARK_IDS, getBenchmarkHistory } from '../../data/mockBenchmarks';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../../utils/formatters';
import { SunriseIcon, NewspaperIcon, CalendarIcon, ArrowUpIcon, ArrowDownIcon, BriefcaseIcon } from '../icons';
import type { NewsHeadline, StockProfile } from '../../types';

const SENTIMENT_STYLES: Record<NewsHeadline['sentiment'], string> = {
  positive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
  negative: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

function benchmarkChange(id: (typeof BENCHMARK_IDS)[number]) {
  const history = getBenchmarkHistory(id);
  const last = history[history.length - 1].close;
  const prev = history[history.length - 2].close;
  return { value: last, changePct: ((last - prev) / prev) * 100 };
}

export function MorningBriefing() {
  const { watchlist, holdings, requestOpenInModelBuilder } = useAppStore();

  const today = useMemo(() => new Date(), []);
  const dateLabel = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(today);
  const timeLabel = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(today);

  const indices = useMemo(() => BENCHMARK_IDS.map((id) => ({ id, ...benchmarkChange(id) })), []);

  const watchedTickers = useMemo(() => {
    const set = new Set<string>([...holdings.map((h) => h.ticker), ...watchlist.map((w) => w.ticker)]);
    return set.size > 0 ? Array.from(set) : POPULAR_TICKERS.slice(0, 6);
  }, [holdings, watchlist]);

  const profiles = useMemo(() => {
    const map: Record<string, StockProfile> = {};
    for (const t of watchedTickers) map[t] = getStockProfile(t);
    return map;
  }, [watchedTickers]);

  const movers = useMemo(() => {
    const list = watchedTickers.map((t) => profiles[t]).sort((a, b) => b.changePct - a.changePct);
    const gainerCount = Math.min(3, Math.ceil(list.length / 2));
    const loserCount = Math.min(3, list.length - gainerCount);
    return {
      gainers: list.slice(0, gainerCount),
      losers: list.slice(list.length - loserCount).reverse(),
    };
  }, [watchedTickers, profiles]);

  const topNews = useMemo(() => {
    const all = watchedTickers.flatMap((t) => profiles[t].news.map((n) => ({ ...n, ticker: t })));
    return all.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  }, [watchedTickers, profiles]);

  const upcomingEvents = useMemo(() => {
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    const all = watchedTickers.flatMap((t) => profiles[t].events.map((e) => ({ ...e, ticker: t })));
    const deduped = Array.from(new Map(all.map((e) => [`${e.ticker}-${e.date}-${e.title}`, e])).values());
    return deduped
      .filter((e) => new Date(e.date) >= new Date(today.toISOString().slice(0, 10)) && new Date(e.date) <= in7Days)
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(0, 6);
  }, [watchedTickers, profiles, today]);

  const portfolioPulse = useMemo(() => {
    if (holdings.length === 0) return null;
    let value = 0;
    let previousValue = 0;
    for (const h of holdings) {
      const p = getStockProfile(h.ticker);
      value += p.price * h.shares;
      previousValue += p.previousClose * h.shares;
    }
    const changeAbs = value - previousValue;
    const changePct = previousValue === 0 ? 0 : (changeAbs / previousValue) * 100;
    return { value, changeAbs, changePct };
  }, [holdings]);

  const mood = useMemo(() => {
    const avgIndexChange = indices.reduce((s, i) => s + i.changePct, 0) / indices.length;
    const positive = topNews.filter((n) => n.sentiment === 'positive').length;
    const negative = topNews.filter((n) => n.sentiment === 'negative').length;
    if (avgIndexChange > 0.25 && positive >= negative) return { label: 'freundlich', tone: 'positive' as const };
    if (avgIndexChange < -0.25 && negative > positive) return { label: 'gedrückt', tone: 'negative' as const };
    return { label: 'uneinheitlich', tone: 'neutral' as const };
  }, [indices, topNews]);

  const leadIndex = indices.reduce((best, i) => (Math.abs(i.changePct) > Math.abs(best.changePct) ? i : best), indices[0]);
  const topGainer = movers.gainers[0];
  const topLoser = movers.losers[0];

  return (
    <div className="space-y-6">
      <div className="card border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-500/20 dark:bg-indigo-500/5">
        <div className="flex items-start gap-3">
          <SunriseIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
              Guten Morgen! Dein Marktüberblick für {dateLabel}, {timeLabel} Uhr
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-indigo-950/80 dark:text-indigo-100/80">
              Die Märkte zeigen sich heute <strong>{mood.label}</strong>: {leadIndex.id} bewegt sich mit{' '}
              {formatPercent(leadIndex.changePct)} am deutlichsten.{' '}
              {topGainer && (
                <>
                  Größter Gewinner in deiner Beobachtung ist <strong>{topGainer.ticker}</strong> ({formatPercent(topGainer.changePct)}),
                  {' '}
                </>
              )}
              {topLoser && (
                <>
                  größter Verlierer <strong>{topLoser.ticker}</strong> ({formatPercent(topLoser.changePct)}).{' '}
                </>
              )}
              {portfolioPulse && (
                <>
                  Dein Portfolio steht heute bei {formatCurrency(portfolioPulse.value)} (
                  {formatPercent(portfolioPulse.changePct)}).{' '}
                </>
              )}
              {upcomingEvents.length > 0
                ? `In den nächsten 7 Tagen stehen ${upcomingEvents.length} Termine bei deinen beobachteten Werten an.`
                : 'Keine wichtigen Termine bei deinen beobachteten Werten in den nächsten 7 Tagen.'}
            </p>
          </div>
        </div>
      </div>

      {/* Indices */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {indices.map((idx) => (
          <div key={idx.id} className="card p-4">
            <p className="text-xs text-slate-400 dark:text-slate-500">{idx.id}</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">{formatNumber(idx.value)}</p>
            <p
              className={`flex items-center gap-0.5 text-xs font-semibold ${
                idx.changePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {idx.changePct >= 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
              {formatPercent(idx.changePct)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Portfolio pulse + movers */}
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <BriefcaseIcon className="h-4 w-4" /> Portfolio-Puls
          </h3>
          {portfolioPulse ? (
            <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
              <span className="text-xs text-slate-500 dark:text-slate-400">Depotwert heute</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(portfolioPulse.value)}</p>
                <p
                  className={`text-xs font-medium ${
                    portfolioPulse.changePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(portfolioPulse.changeAbs)} ({formatPercent(portfolioPulse.changePct)})
                </p>
              </div>
            </div>
          ) : (
            <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">Noch keine Positionen im Depot.</p>
          )}

          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-600">
            Bewegungen bei deinen beobachteten Werten
          </p>
          <div className="space-y-1.5">
            {movers.gainers.map((p) => (
              <MoverRow key={`gain-${p.ticker}`} profile={p} />
            ))}
            {movers.losers.map((p) => (
              <MoverRow key={`lose-${p.ticker}`} profile={p} />
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <CalendarIcon className="h-4 w-4" /> Termine diese Woche
          </h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">Keine anstehenden Termine bei deinen beobachteten Werten.</p>
          ) : (
            <ul className="space-y-2.5">
              {upcomingEvents.map((e) => (
                <li key={`${e.ticker}-${e.id}`} className="flex items-center gap-3 text-sm">
                  <span className="w-20 flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatDate(e.date)}</span>
                  <button
                    className="flex-shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    onClick={() => requestOpenInModelBuilder(e.ticker)}
                  >
                    {e.ticker}
                  </button>
                  <span className="text-slate-700 dark:text-slate-200">{e.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* News digest */}
      <div className="card p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <NewspaperIcon className="h-4 w-4" /> Die wichtigsten Schlagzeilen
        </h3>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {topNews.map((n) => (
            <li key={`${n.ticker}-${n.id}`} className="border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-700 dark:text-slate-200">{n.title}</p>
                <span className={`badge flex-shrink-0 ${SENTIMENT_STYLES[n.sentiment]}`}>{n.ticker}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {n.source} · {formatDate(n.date)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MoverRow({ profile }: { profile: StockProfile }) {
  const positive = profile.changePct >= 0;
  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{profile.ticker}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500">{formatCurrency(profile.price, profile.currency)}</span>
      </div>
      <span
        className={`flex items-center gap-0.5 text-xs font-semibold ${
          positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
        }`}
      >
        {positive ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
        {formatPercent(profile.changePct)}
      </span>
    </div>
  );
}
