import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useAppStore } from '../../store/AppStore';
import { getStockProfile } from '../../data/mockStocks';
import type { ValuationInputs, ValuationModel, ValuationMethod } from '../../types';
import { runDcf, runScenarios, runSensitivity, runComparables, runDdm } from '../../utils/dcf';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';
import { DownloadIcon, TrashIcon, SlidersIcon } from '../icons';

const DEFAULT_INPUTS: ValuationInputs = {
  ticker: 'SAP',
  currentPrice: 231.4,
  peRatio: 28.5,
  psRatio: 6.2,
  debtToEquity: 0.35,
  growth3y: 12,
  growth5y: 10,
  growth10y: 7,
  wacc: 8,
  marginOfSafety: 20,
  epsBase: 8.1,
  terminalGrowth: 2.5,
  dividendPerShare: 1.85,
  dividendGrowthRate: 3,
};

const RECOMMENDATION_STYLES: Record<string, string> = {
  Kaufen: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Halten: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  Verkaufen: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
};

const METHOD_TABS: { id: ValuationMethod; label: string }[] = [
  { id: 'dcf', label: 'DCF' },
  { id: 'comparables', label: 'Comparables' },
  { id: 'ddm', label: 'Dividend Discount' },
];

function loadFromTicker(ticker: string): ValuationInputs {
  const profile = getStockProfile(ticker);
  const price = profile.price;
  const estimatedDividend = Math.max(0, (price * profile.fundamentals.dividendYield) / 100);
  return {
    ticker: profile.ticker,
    currentPrice: price,
    peRatio: profile.fundamentals.peRatio,
    psRatio: profile.fundamentals.psRatio,
    debtToEquity: profile.fundamentals.debtToEquity,
    growth3y: Math.max(2, profile.fundamentals.epsGrowthYoY),
    growth5y: Math.max(1.5, profile.fundamentals.epsGrowthYoY * 0.8),
    growth10y: Math.max(1, profile.fundamentals.epsGrowthYoY * 0.5),
    wacc: 8,
    marginOfSafety: 20,
    epsBase: Math.max(0.1, price / profile.fundamentals.peRatio),
    terminalGrowth: 2.5,
    dividendPerShare: Math.round(estimatedDividend * 100) / 100,
    dividendGrowthRate: 3,
  };
}

export function ModelBuilder() {
  const { openInModelBuilder, clearOpenInModelBuilder, saveValuationModel, valuationModels, deleteValuationModel } = useAppStore();
  const [inputs, setInputs] = useState<ValuationInputs>(DEFAULT_INPUTS);
  const [modelName, setModelName] = useState('Mein Bewertungsmodell');
  const [method, setMethod] = useState<ValuationMethod>('dcf');

  useEffect(() => {
    if (openInModelBuilder) {
      setInputs(loadFromTicker(openInModelBuilder));
      setModelName(`${openInModelBuilder} Bewertungsmodell`);
      clearOpenInModelBuilder();
    }
  }, [openInModelBuilder, clearOpenInModelBuilder]);

  const dcf = useMemo(() => runDcf(inputs), [inputs]);
  const scenarios = useMemo(() => runScenarios(inputs), [inputs]);
  const sensitivity = useMemo(() => runSensitivity(inputs), [inputs]);
  const comparables = useMemo(() => runComparables(inputs), [inputs]);
  const ddm = useMemo(() => runDdm(inputs), [inputs]);

  function update<K extends keyof ValuationInputs>(key: K, value: ValuationInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleLoadTicker() {
    setInputs(loadFromTicker(inputs.ticker));
  }

  function handleSave() {
    const model: ValuationModel = {
      id: `model-${Date.now()}`,
      name: modelName || `${inputs.ticker} Modell`,
      createdAt: new Date().toISOString(),
      inputs,
    };
    saveValuationModel(model);
  }

  const chartData = [
    { name: 'Aktueller Kurs', value: inputs.currentPrice },
    { name: 'Fair Value', value: dcf.fairValueBlended },
    { name: 'Kaufkurs (mit Marge)', value: dcf.buyBelowPrice },
  ];

  const maxSensitivity = Math.max(...sensitivity.grid.flat());
  const minSensitivity = Math.min(...sensitivity.grid.flat());

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
      {/* Inputs */}
      <div className="space-y-4">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Unternehmensdaten</h3>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="label">Ticker</label>
                <input className="input" value={inputs.ticker} onChange={(e) => update('ticker', e.target.value.toUpperCase())} />
              </div>
              <div className="flex items-end">
                <button className="btn-secondary" onClick={handleLoadTicker} title="Daten aus Market Researcher laden">
                  Laden
                </button>
              </div>
            </div>
            <NumberField label="Aktueller Kurs" value={inputs.currentPrice} onChange={(v) => update('currentPrice', v)} step={0.1} />
            <NumberField label="EPS / FCF je Aktie (Basis)" value={inputs.epsBase} onChange={(v) => update('epsBase', v)} step={0.1} />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="KGV" value={inputs.peRatio} onChange={(v) => update('peRatio', v)} step={0.1} />
              <NumberField label="KUV" value={inputs.psRatio} onChange={(v) => update('psRatio', v)} step={0.1} />
            </div>
            <NumberField label="Verschuldungsquote (D/E)" value={inputs.debtToEquity} onChange={(v) => update('debtToEquity', v)} step={0.05} />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <SlidersIcon className="h-4 w-4" /> Wachstum & Diskontierung
          </h3>
          <div className="space-y-4">
            <SliderField label="Gewinnwachstum 3 Jahre" value={inputs.growth3y} onChange={(v) => update('growth3y', v)} min={-10} max={40} step={0.5} />
            <SliderField label="Gewinnwachstum 5 Jahre" value={inputs.growth5y} onChange={(v) => update('growth5y', v)} min={-10} max={30} step={0.5} />
            <SliderField label="Gewinnwachstum 10 Jahre" value={inputs.growth10y} onChange={(v) => update('growth10y', v)} min={-5} max={20} step={0.5} />
            <SliderField label="Terminal-Wachstum" value={inputs.terminalGrowth} onChange={(v) => update('terminalGrowth', v)} min={0} max={5} step={0.25} />
            <SliderField label="Diskontierungssatz / WACC" value={inputs.wacc} onChange={(v) => update('wacc', v)} min={3} max={15} step={0.25} />
            <SliderField label="Sicherheitsmarge" value={inputs.marginOfSafety} onChange={(v) => update('marginOfSafety', v)} min={0} max={50} step={1} />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Dividende (für Dividend Discount Model)</h3>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Dividende / Aktie" value={inputs.dividendPerShare} onChange={(v) => update('dividendPerShare', v)} step={0.05} />
            <NumberField label="Dividendenwachstum (%)" value={inputs.dividendGrowthRate} onChange={(v) => update('dividendGrowthRate', v)} step={0.25} />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Modell speichern</h3>
          <input className="input mb-2" value={modelName} onChange={(e) => setModelName(e.target.value)} />
          <button className="btn-primary w-full" onClick={handleSave}>
            Modell speichern
          </button>

          {valuationModels.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
              {valuationModels.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <button className="min-w-0 flex-1 truncate text-left text-xs text-slate-600 dark:text-slate-300" onClick={() => setInputs(m.inputs)}>
                    {m.name} <span className="text-slate-400">({m.inputs.ticker})</span>
                  </button>
                  <button onClick={() => deleteValuationModel(m.id)} className="btn-ghost !p-1">
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Results */}
      <div id="model-builder-results" className="min-w-0 space-y-6 bg-slate-50 dark:bg-slate-950">
        <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          {METHOD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethod(tab.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                method === tab.id
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {method === 'comparables' && (
          <ComparablesPanel inputs={inputs} result={comparables} onExport={() => exportElementToPdf('model-builder-results', `${inputs.ticker}-comparables.pdf`)} />
        )}
        {method === 'ddm' && (
          <DdmPanel inputs={inputs} result={ddm} onExport={() => exportElementToPdf('model-builder-results', `${inputs.ticker}-ddm.pdf`)} />
        )}

        {method === 'dcf' && (
        <>
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Empfehlung für {inputs.ticker}</p>
              <span className={`badge mt-1 !text-sm ${RECOMMENDATION_STYLES[dcf.recommendation]}`}>{dcf.recommendation}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Fair Value (blended)</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(dcf.fairValueBlended)}</p>
              <p className={`text-sm font-medium ${dcf.upsidePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatPercent(dcf.upsidePct)} vs. aktuellem Kurs
              </p>
            </div>
            <button className="btn-secondary" onClick={() => exportElementToPdf('model-builder-results', `${inputs.ticker}-bewertungsmodell.pdf`)}>
              <DownloadIcon className="h-4 w-4" />
              Als PDF exportieren
            </button>
          </div>

          <div className="mt-5 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={70} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#8a8a87' : i === 1 ? '#9c7239' : '#5b7553'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <p className="text-slate-400">DCF Fair Value</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(dcf.fairValueDcf)}</p>
            </div>
            <div>
              <p className="text-slate-400">Multiple-Ansatz</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(dcf.fairValueMultiple)}</p>
            </div>
            <div>
              <p className="text-slate-400">Kaufkurs (Sicherheitsmarge)</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(dcf.buyBelowPrice)}</p>
            </div>
          </div>
        </div>

        {/* Scenario comparison */}
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Wachstums-Szenarien</h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scenarios} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={70} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <ReferenceLine y={inputs.currentPrice} stroke="#c17f3e" strokeDasharray="4 4" label={{ value: 'Aktueller Kurs', fontSize: 11, fill: '#c17f3e', position: 'insideTopLeft' }} />
                <Bar dataKey="fairValue" radius={[6, 6, 0, 0]}>
                  {scenarios.map((s, i) => (
                    <Cell key={i} fill={s.name === 'Bear Case' ? '#a6192e' : s.name === 'Bull Case' ? '#5b7553' : '#9c7239'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
            {scenarios.map((s) => (
              <div key={s.name}>
                <p className="text-slate-400">{s.name}</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(s.fairValue)}</p>
                <p className={s.upsidePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                  {formatPercent(s.upsidePct)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sensitivity */}
        <div className="card p-5">
          <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Sensitivitätsanalyse</h3>
          <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">Fair Value bei Änderung von WACC (Zeilen) und 5-Jahres-Wachstum (Spalten)</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-center text-xs">
              <thead>
                <tr>
                  <th className="p-1.5 text-slate-400">WACC \ Wachstum</th>
                  {sensitivity.growthSteps.map((g, i) => (
                    <th key={i} className="p-1.5 font-medium text-slate-500 dark:text-slate-400">
                      {g.toFixed(1)}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sensitivity.grid.map((row, ri) => (
                  <tr key={ri}>
                    <td className="p-1.5 font-medium text-slate-500 dark:text-slate-400">{sensitivity.waccSteps[ri].toFixed(1)}%</td>
                    {row.map((value, ci) => {
                      const ratio = maxSensitivity === minSensitivity ? 0.5 : (value - minSensitivity) / (maxSensitivity - minSensitivity);
                      const bg = `rgba(156, 114, 57, ${0.08 + ratio * 0.35})`;
                      const isCenter = ri === 2 && ci === 2;
                      return (
                        <td
                          key={ci}
                          className={`p-1.5 font-medium text-slate-700 dark:text-slate-200 ${isCenter ? 'ring-1 ring-inset ring-indigo-500' : ''}`}
                          style={{ backgroundColor: bg }}
                        >
                          {formatCurrency(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

function ComparablesPanel({
  inputs,
  result,
  onExport,
}: {
  inputs: ValuationInputs;
  result: ReturnType<typeof runComparables>;
  onExport: () => void;
}) {
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Empfehlung für {inputs.ticker}</p>
          <span className={`badge mt-1 !text-sm ${RECOMMENDATION_STYLES[result.recommendation]}`}>{result.recommendation}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">Fair Value (Comparables)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(result.fairValue)}</p>
          <p className={`text-sm font-medium ${result.upsidePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatPercent(result.upsidePct)} vs. aktuellem Kurs
          </p>
        </div>
        <button className="btn-secondary" onClick={onExport}>
          <DownloadIcon className="h-4 w-4" />
          Als PDF exportieren
        </button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Comparable Company Analysis: Der EPS-Basiswert ({formatCurrency(inputs.epsBase)}) wird mit dem 5-Jahres-Wachstum von{' '}
        {formatPercent(inputs.growth5y, 1)} fünf Jahre in die Zukunft projiziert und anschließend mit dem KGV von {inputs.peRatio}×
        bewertet – so, wie es der Markt heute für vergleichbare Unternehmen zahlt.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
        <div>
          <p className="text-slate-400">EPS in 5 Jahren</p>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(result.projectedEps)}</p>
        </div>
        <div>
          <p className="text-slate-400">Angewandtes KGV</p>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{inputs.peRatio}×</p>
        </div>
        <div>
          <p className="text-slate-400">Kaufkurs (Sicherheitsmarge)</p>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(result.buyBelowPrice)}</p>
        </div>
      </div>
    </div>
  );
}

function DdmPanel({
  inputs,
  result,
  onExport,
}: {
  inputs: ValuationInputs;
  result: ReturnType<typeof runDdm>;
  onExport: () => void;
}) {
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Empfehlung für {inputs.ticker}</p>
          <span className={`badge mt-1 !text-sm ${RECOMMENDATION_STYLES[result.recommendation]}`}>{result.recommendation}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">Fair Value (Dividend Discount Model)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.valid ? formatCurrency(result.fairValue) : '–'}</p>
          {result.valid && (
            <p className={`text-sm font-medium ${result.upsidePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatPercent(result.upsidePct)} vs. aktuellem Kurs
            </p>
          )}
        </div>
        <button className="btn-secondary" onClick={onExport}>
          <DownloadIcon className="h-4 w-4" />
          Als PDF exportieren
        </button>
      </div>

      {!result.valid ? (
        <p className="mt-4 rounded-lg bg-amber-100 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Das Dividend Discount Model liefert hier kein sinnvolles Ergebnis: entweder ist die Dividende je Aktie 0, oder das
          Dividendenwachstum liegt über dem WACC. Dieses Modell eignet sich nur für etablierte, stabile Dividendenzahler mit
          Wachstum &lt; Diskontierungssatz.
        </p>
      ) : (
        <>
          <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Gordon-Growth-Modell: Die für nächstes Jahr erwartete Dividende ({formatCurrency(result.d1)}) wird mit „Diskontierungssatz
            minus Dividendenwachstum" ({formatPercent(inputs.wacc - inputs.dividendGrowthRate, 1)}) kapitalisiert – geeignet für
            Dividenden-Aristokraten mit stabilem Ausschüttungswachstum.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <p className="text-slate-400">Dividende (nächstes Jahr)</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(result.d1)}</p>
            </div>
            <div>
              <p className="text-slate-400">Dividendenwachstum</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{formatPercent(inputs.dividendGrowthRate, 1)}</p>
            </div>
            <div>
              <p className="text-slate-400">Kaufkurs (Sicherheitsmarge)</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(result.buyBelowPrice)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.5,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="label !mb-0">{label}</label>
        <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">{value.toFixed(step < 1 ? 2 : 1)}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-indigo-600"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        step={step}
        className="input"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
      />
    </div>
  );
}
