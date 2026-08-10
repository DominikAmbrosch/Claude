import { useMemo } from 'react';
import { useAppStore } from '../../store/AppStore';
import { getStockProfile, POPULAR_TICKERS } from '../../data/mockStocks';
import {
  computeSignal,
  deriveHoldingAction,
  deriveOpportunityTier,
  getHoldingActionStyle,
  getTierStyle,
  type SignalReason,
} from '../../utils/investmentSignals';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { LightbulbIcon, StarIcon, CalculatorIcon, ArrowUpIcon, ArrowDownIcon, BriefcaseIcon } from '../icons';

function ScoreMeter({ score }: { score: number }) {
  const color = score >= 68 ? 'bg-emerald-500' : score >= 45 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">{score}/100</span>
    </div>
  );
}

const TONE_PRIORITY: Record<SignalReason['tone'], number> = { positive: 0, neutral: 1, negative: 2 };

function sortReasonsForOpportunity(reasons: SignalReason[]): SignalReason[] {
  return [...reasons].sort((a, b) => TONE_PRIORITY[a.tone] - TONE_PRIORITY[b.tone]);
}

function ReasonList({ reasons, limit }: { reasons: SignalReason[]; limit?: number }) {
  const shown = limit ? reasons.slice(0, limit) : reasons;
  if (shown.length === 0) {
    return <p className="text-xs text-slate-400 dark:text-slate-600">Keine auffälligen Signale – neutrales Bild.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {shown.map((r, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span
            className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${
              r.tone === 'positive' ? 'bg-emerald-500' : r.tone === 'negative' ? 'bg-rose-500' : 'bg-amber-500'
            }`}
          />
          {r.text}
        </li>
      ))}
    </ul>
  );
}

export function InvestmentTips() {
  const { holdings, watchlist, requestOpenInModelBuilder, addToWatchlist } = useAppStore();

  const holdingCards = useMemo(
    () =>
      holdings.map((h) => {
        const profile = getStockProfile(h.ticker);
        const signal = computeSignal(profile);
        const plPct = ((profile.price - h.buyPrice) / h.buyPrice) * 100;
        const { action, extraReason } = deriveHoldingAction(signal, plPct);
        const reasons = extraReason ? [extraReason, ...signal.reasons] : signal.reasons;
        return { holding: h, profile, signal, plPct, action, reasons };
      }),
    [holdings],
  );

  const opportunityCards = useMemo(() => {
    const heldTickers = new Set(holdings.map((h) => h.ticker));
    const universe = Array.from(new Set([...POPULAR_TICKERS, ...watchlist.map((w) => w.ticker)])).filter(
      (t) => !heldTickers.has(t),
    );
    return universe
      .map((ticker) => {
        const profile = getStockProfile(ticker);
        const signal = computeSignal(profile);
        return { profile, signal, tier: deriveOpportunityTier(signal.score) };
      })
      .sort((a, b) => b.signal.score - a.signal.score)
      .slice(0, 6);
  }, [holdings, watchlist]);

  return (
    <div className="space-y-6">
      <div className="card border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-500/20 dark:bg-indigo-500/5">
        <div className="flex items-start gap-3">
          <LightbulbIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">Wie diese Einschätzungen entstehen</h3>
            <p className="mt-1 text-sm leading-relaxed text-indigo-950/80 dark:text-indigo-100/80">
              Jede Aktie erhält einen Score von 0–100 aus vier Bausteinen: Analysten-Kurspotenzial &amp; -Konsens,
              Nachrichten-Sentiment der letzten Meldungen, technischem Momentum (Trend &amp; RSI) sowie fundamentalem
              Wachstum. Der Score entscheidet, ob eine gehaltene Position eher zum Nachkaufen, Halten oder Verkaufen
              taugt – und welche neuen Werte aktuell am attraktivsten aussehen.
            </p>
          </div>
        </div>
      </div>

      {/* Holdings check */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <BriefcaseIcon className="h-4 w-4" /> Deine Positionen im Check
        </h3>
        {holdingCards.length === 0 ? (
          <div className="card p-5 text-sm text-slate-400 dark:text-slate-500">
            Noch keine Positionen im Depot. Trag deine Aktien im Modul „Portfolio" ein, um hier laufende
            Halten/Verkaufen-Einschätzungen zu bekommen.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {holdingCards.map(({ holding, profile, signal, plPct, action, reasons }) => (
              <div key={holding.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{profile.name}</span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {profile.ticker}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      {holding.shares} Stk. · Kaufkurs {formatCurrency(holding.buyPrice, profile.currency)} · aktuell{' '}
                      {formatCurrency(profile.price, profile.currency)}
                    </p>
                  </div>
                  <span className={`badge ${getHoldingActionStyle(action)}`}>{action}</span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <ScoreMeter score={signal.score} />
                  <span
                    className={`flex items-center gap-0.5 text-xs font-semibold ${
                      plPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {plPct >= 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                    {formatPercent(plPct)} seit Kauf
                  </span>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <ReasonList reasons={reasons} limit={4} />
                </div>

                <button className="btn-secondary mt-3 w-full" onClick={() => requestOpenInModelBuilder(profile.ticker)}>
                  <CalculatorIcon className="h-4 w-4" />
                  Fair Value im Model Builder prüfen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New opportunities */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <LightbulbIcon className="h-4 w-4" /> Neue Chancen
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {opportunityCards.map(({ profile, signal, tier }) => {
            const isWatched = watchlist.some((w) => w.ticker === profile.ticker);
            return (
              <div key={profile.ticker} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{profile.ticker}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{profile.sector}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{profile.name}</p>
                  </div>
                  <span className={`badge whitespace-nowrap ${getTierStyle(tier)}`}>{tier}</span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <ScoreMeter score={signal.score} />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(profile.price, profile.currency)}
                  </span>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-600">
                    Warum es lukrativ sein kann
                  </p>
                  <ReasonList reasons={sortReasonsForOpportunity(signal.reasons)} limit={3} />
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    className="btn-secondary flex-1"
                    disabled={isWatched}
                    onClick={() => addToWatchlist(profile.ticker)}
                  >
                    <StarIcon className="h-4 w-4" filled={isWatched} />
                    {isWatched ? 'Beobachtet' : 'Watchlist'}
                  </button>
                  <button className="btn-primary flex-1" onClick={() => requestOpenInModelBuilder(profile.ticker)}>
                    <CalculatorIcon className="h-4 w-4" />
                    Bewerten
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
