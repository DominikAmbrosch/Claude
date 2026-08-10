import { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useAppStore } from '../../store/AppStore';
import { getStockProfile, POPULAR_TICKERS } from '../../data/mockStocks';
import type { PortfolioHolding } from '../../types';
import { buildPortfolioSummary, aggregateBy, buildPerformanceSeries, type AllocationSlice } from '../../utils/portfolioMetrics';
import { BENCHMARK_IDS, type BenchmarkId } from '../../data/mockBenchmarks';
import { formatCurrency, formatPercent, formatDate, formatNumber, formatHoldingPeriod } from '../../utils/formatters';
import { downloadCsvFile, exportElementToPdf } from '../../utils/pdfExport';
import { PlusIcon, TrashIcon, EditIcon, CheckIcon, CloseIcon, DownloadIcon, BellIcon } from '../icons';
import { PositionDialog, type PositionFormValues } from './PositionDialog';

const PIE_COLORS = ['#9c7239', '#5b7553', '#a6192e', '#c17f3e', '#7c93a6', '#8c7ba6', '#57585a', '#c98d82'];

export function PortfolioDashboard() {
  const { holdings, addHolding, updateHolding, removeHolding, watchlist, alerts, setAlert, valuationModels, requestOpenInModelBuilder } =
    useAppStore();
  const [benchmark, setBenchmark] = useState<BenchmarkId>('DAX');
  const [simulatedCash, setSimulatedCash] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<PortfolioHolding | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const allTickers = useMemo(() => {
    const set = new Set<string>([...holdings.map((h) => h.ticker), ...watchlist.map((w) => w.ticker), ...POPULAR_TICKERS]);
    return Array.from(set);
  }, [holdings, watchlist]);

  const profiles = useMemo(() => {
    const map: Record<string, ReturnType<typeof getStockProfile>> = {};
    for (const t of allTickers) map[t] = getStockProfile(t);
    return map;
  }, [allTickers]);

  const summary = useMemo(() => buildPortfolioSummary(holdings, profiles), [holdings, profiles]);
  const sectorAllocation = useMemo(() => aggregateBy(summary.holdings, 'sector'), [summary.holdings]);
  const countryAllocation = useMemo(() => aggregateBy(summary.holdings, 'country'), [summary.holdings]);
  const { series: performanceSeries, risk } = useMemo(() => buildPerformanceSeries(summary.holdings, benchmark), [summary.holdings, benchmark]);

  function handleDialogSubmit(values: PositionFormValues) {
    const shares = parseFloat(values.shares);
    const buyPrice = parseFloat(values.buyPrice);
    if (editingHolding) {
      updateHolding(editingHolding.id, { shares, buyPrice, buyDate: values.buyDate });
    } else {
      const profile = getStockProfile(values.ticker);
      addHolding({
        id: `holding-${Date.now()}`,
        ticker: profile.ticker,
        shares,
        buyPrice,
        buyDate: values.buyDate,
        sector: profile.sector,
        country: profile.country,
      });
    }
    setDialogOpen(false);
    setEditingHolding(null);
  }

  function handleDeleteConfirmed(id: string) {
    removeHolding(id);
    setConfirmDeleteId(null);
  }

  function handleExportCsv() {
    const rows: (string | number)[][] = [
      ['Ticker', 'Anzahl', 'Kaufpreis', 'Kaufdatum', 'Aktueller Kurs', 'Aktueller Wert', 'G/V absolut', 'G/V %', 'Gewichtung %'],
      ...summary.holdings.map((h) => [
        h.ticker,
        h.shares,
        h.buyPrice,
        h.buyDate,
        h.profile?.price ?? 0,
        Math.round(h.currentValue * 100) / 100,
        Math.round(h.plAbs * 100) / 100,
        Math.round(h.plPct * 100) / 100,
        Math.round(h.weightPct * 100) / 100,
      ]),
    ];
    downloadCsvFile('portfolio-export.csv', rows);
  }

  const simulatedTotal = summary.totalValue + simulatedCash;

  return (
    <div id="portfolio-dashboard" className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Gesamtwert" value={formatCurrency(summary.totalValue)} />
        <SummaryCard
          label="Gewinn / Verlust"
          value={formatCurrency(summary.totalPlAbs)}
          sub={formatPercent(summary.totalPlPct)}
          positive={summary.totalPlAbs >= 0}
        />
        <SummaryCard label="Volatilität p.a." value={`${formatNumber(risk.volatilityAnnualizedPct)}%`} />
        <SummaryCard label="Sharpe Ratio" value={formatNumber(risk.sharpeRatio, 2)} sub={`Beta ${formatNumber(risk.beta, 2)}`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          {/* Holdings table */}
          <div className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Positionen</h3>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={handleExportCsv}>
                  <DownloadIcon className="h-4 w-4" />
                  Excel (CSV)
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setEditingHolding(null);
                    setDialogOpen(true);
                  }}
                >
                  <PlusIcon className="h-4 w-4" />
                  Position hinzufügen
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 dark:text-slate-500">
                    <th className="pb-2 font-medium">Ticker</th>
                    <th className="pb-2 font-medium">Anzahl</th>
                    <th className="pb-2 font-medium">Ø-Kaufkurs</th>
                    <th className="pb-2 font-medium">Aktuell</th>
                    <th className="pb-2 font-medium">Wert</th>
                    <th className="pb-2 font-medium">G/V</th>
                    <th className="pb-2 font-medium">Gewicht</th>
                    <th className="pb-2 font-medium">Haltedauer</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {summary.holdings.map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 font-medium text-slate-800 dark:text-slate-100">{h.ticker}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">{h.shares}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">{formatCurrency(h.buyPrice)}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">{formatCurrency(h.profile?.price ?? 0)}</td>
                      <td className="py-2.5 font-medium text-slate-800 dark:text-slate-100">{formatCurrency(h.currentValue)}</td>
                      <td className={`py-2.5 font-medium ${h.plAbs >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(h.plAbs)}
                        <span className="ml-1 text-xs">({formatPercent(h.plPct)})</span>
                      </td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">{formatNumber(h.weightPct)}%</td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">{formatHoldingPeriod(h.buyDate)}</td>
                      <td className="py-2.5 text-right">
                        {confirmDeleteId === h.id ? (
                          <span className="flex items-center justify-end gap-1 whitespace-nowrap">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Löschen?</span>
                            <button onClick={() => handleDeleteConfirmed(h.id)} className="btn-ghost !p-1 !text-rose-600 dark:!text-rose-400" title="Bestätigen">
                              <CheckIcon className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} className="btn-ghost !p-1" title="Abbrechen">
                              <CloseIcon className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingHolding(h);
                                setDialogOpen(true);
                              }}
                              className="btn-ghost !p-1"
                              title="Bearbeiten"
                            >
                              <EditIcon className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setConfirmDeleteId(h.id)} className="btn-ghost !p-1" title="Löschen">
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {summary.holdings.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-xs text-slate-400">
                        Noch keine Positionen im Depot.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <PositionDialog
            open={dialogOpen}
            onClose={() => {
              setDialogOpen(false);
              setEditingHolding(null);
            }}
            onSubmit={handleDialogSubmit}
            editing={editingHolding}
            tickerSuggestions={allTickers}
          />

          {/* Performance vs Benchmark */}
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Performance vs. Benchmark</h3>
              <select value={benchmark} onChange={(e) => setBenchmark(e.target.value as BenchmarkId)} className="input !w-auto !py-1.5 text-xs">
                {BENCHMARK_IDS.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceSeries}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis tick={{ fontSize: 11 }} width={40} domain={['auto', 'auto']} />
                  <Tooltip formatter={(v) => `${formatNumber(Number(v))} (indexiert=100)`} labelFormatter={(l) => formatDate(l as string)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="portfolio" name="Portfolio" stroke="#9c7239" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="benchmark" name={benchmark} stroke="#8a8a87" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Allocation */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <AllocationPie title="Allokation nach Branche" data={sectorAllocation} />
            <AllocationPie title="Allokation nach Land" data={countryAllocation} />
          </div>

          {/* What-if simulation */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Szenario: Zusätzliches Investment</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="label">Zusätzlicher Betrag (€)</label>
                <input type="number" className="input" value={simulatedCash || ''} onChange={(e) => setSimulatedCash(parseFloat(e.target.value) || 0)} placeholder="z.B. 5000" />
              </div>
              <button className="btn-secondary" onClick={() => exportElementToPdf('portfolio-dashboard', 'portfolio-report.pdf')}>
                <DownloadIcon className="h-4 w-4" />
                PDF-Report
              </button>
            </div>
            {simulatedCash > 0 && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                <p className="text-slate-600 dark:text-slate-300">
                  Neuer Depotwert (proportional investiert): <strong className="text-slate-900 dark:text-white">{formatCurrency(simulatedTotal)}</strong>
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Bei proportionaler Investition entsprechend der aktuellen Gewichtung bleibt die Branchen-/Länder-Allokation
                  nahezu unverändert.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Watchlist + alerts sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Watchlist-Monitoring</h3>
            {watchlist.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500">Keine Watchlist-Einträge.</p>}
            <ul className="space-y-3">
              {watchlist.map((w) => {
                const profile = profiles[w.ticker];
                const model = valuationModels.find((m) => m.inputs.ticker === w.ticker);
                const alert = alerts.find((a) => a.ticker === w.ticker);
                return (
                  <li key={w.ticker} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{w.ticker}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{profile ? formatCurrency(profile.price, profile.currency) : '–'}</span>
                    </div>
                    {model ? (
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Gespeichertes Modell vorhanden ({model.name})</p>
                    ) : (
                      <button className="mt-0.5 text-xs text-indigo-600 hover:underline dark:text-indigo-400" onClick={() => requestOpenInModelBuilder(w.ticker)}>
                        Fair Value berechnen →
                      </button>
                    )}
                    <div className="mt-2 flex items-center gap-1.5">
                      <BellIcon className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                      <input
                        type="number"
                        placeholder="Alarm über"
                        defaultValue={alert?.above}
                        onBlur={(e) => setAlert(w.ticker, e.target.value ? parseFloat(e.target.value) : undefined, alert?.below)}
                        className="input !py-1 !text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Alarm unter"
                        defaultValue={alert?.below}
                        onBlur={(e) => setAlert(w.ticker, alert?.above, e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="input !py-1 !text-xs"
                      />
                    </div>
                    {alert && profile && (
                      <>
                        {alert.above !== undefined && profile.price >= alert.above && (
                          <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">⚠ Kurs über Alarmgrenze {formatCurrency(alert.above)}</p>
                        )}
                        {alert.below !== undefined && profile.price <= alert.below && (
                          <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">⚠ Kurs unter Alarmgrenze {formatCurrency(alert.below)}</p>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{value}</p>
      {sub && (
        <p className={`text-xs font-medium ${positive === undefined ? 'text-slate-400' : positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

function AllocationTooltip({ active, payload }: { active?: boolean; payload?: { payload: AllocationSlice }[] }) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 font-semibold text-slate-900 dark:text-white">
        {slice.name} · {formatCurrency(slice.value)}
      </p>
      <ul className="space-y-0.5">
        {slice.positions.map((p) => (
          <li key={p.ticker} className="flex justify-between gap-3 text-slate-500 dark:text-slate-400">
            <span>{p.ticker}</span>
            <span>{formatCurrency(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AllocationPie({ title, data }: { title: string; data: AllocationSlice[] }) {
  return (
    <div className="card p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      {data.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">Keine Daten.</p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<AllocationTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
