import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { WatchlistItem, ValuationModel, PortfolioHolding, PriceAlert, EarningsAnalysis, ModuleId } from '../types';

const STORAGE_KEY = 'investor-dashboard-state-v1';

interface PersistedState {
  theme: 'light' | 'dark';
  watchlist: WatchlistItem[];
  valuationModels: ValuationModel[];
  holdings: PortfolioHolding[];
  alerts: PriceAlert[];
  earningsAnalyses: EarningsAnalysis[];
  cashAdded: number;
}

const DEFAULT_STATE: PersistedState = {
  theme: 'dark',
  watchlist: [
    { ticker: 'SAP', addedAt: new Date().toISOString() },
    { ticker: 'SIE', addedAt: new Date().toISOString() },
  ],
  valuationModels: [],
  holdings: [
    { id: 'seed-1', ticker: 'SAP', shares: 20, buyPrice: 178.4, buyDate: '2024-03-12', sector: 'Technologie', country: 'Deutschland' },
    { id: 'seed-2', ticker: 'ALV', shares: 8, buyPrice: 255.1, buyDate: '2024-06-04', sector: 'Finanzen', country: 'Deutschland' },
    { id: 'seed-3', ticker: 'AAPL', shares: 12, buyPrice: 189.3, buyDate: '2024-01-20', sector: 'Technologie', country: 'USA' },
  ],
  alerts: [],
  earningsAnalyses: [],
  cashAdded: 0,
};

function loadState(): PersistedState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

interface AppStoreValue extends PersistedState {
  activeModule: ModuleId;
  setActiveModule: (m: ModuleId) => void;
  toggleTheme: () => void;
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;
  setAlert: (ticker: string, above?: number, below?: number) => void;
  saveValuationModel: (model: ValuationModel) => void;
  deleteValuationModel: (id: string) => void;
  addHolding: (holding: PortfolioHolding) => void;
  removeHolding: (id: string) => void;
  setCashAdded: (v: number) => void;
  saveEarningsAnalysis: (analysis: EarningsAnalysis) => void;
  deleteEarningsAnalysis: (id: string) => void;
  openInModelBuilder: string | null;
  requestOpenInModelBuilder: (ticker: string) => void;
  clearOpenInModelBuilder: () => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadState);
  const [activeModule, setActiveModule] = useState<ModuleId>('briefing');
  const [openInModelBuilder, setOpenInModelBuilder] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [state.theme]);

  const value = useMemo<AppStoreValue>(
    () => ({
      ...state,
      activeModule,
      setActiveModule,
      toggleTheme: () => setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })),
      addToWatchlist: (ticker) =>
        setState((s) => {
          const t = ticker.trim().toUpperCase();
          if (!t || s.watchlist.some((w) => w.ticker === t)) return s;
          return { ...s, watchlist: [...s.watchlist, { ticker: t, addedAt: new Date().toISOString() }] };
        }),
      removeFromWatchlist: (ticker) =>
        setState((s) => ({ ...s, watchlist: s.watchlist.filter((w) => w.ticker !== ticker) })),
      setAlert: (ticker, above, below) =>
        setState((s) => {
          const others = s.alerts.filter((a) => a.ticker !== ticker);
          if (above === undefined && below === undefined) return { ...s, alerts: others };
          return { ...s, alerts: [...others, { ticker, above, below }] };
        }),
      saveValuationModel: (model) =>
        setState((s) => ({
          ...s,
          valuationModels: [model, ...s.valuationModels.filter((m) => m.id !== model.id)],
        })),
      deleteValuationModel: (id) =>
        setState((s) => ({ ...s, valuationModels: s.valuationModels.filter((m) => m.id !== id) })),
      addHolding: (holding) => setState((s) => ({ ...s, holdings: [...s.holdings, holding] })),
      removeHolding: (id) => setState((s) => ({ ...s, holdings: s.holdings.filter((h) => h.id !== id) })),
      setCashAdded: (v) => setState((s) => ({ ...s, cashAdded: v })),
      saveEarningsAnalysis: (analysis) =>
        setState((s) => ({ ...s, earningsAnalyses: [analysis, ...s.earningsAnalyses] })),
      deleteEarningsAnalysis: (id) =>
        setState((s) => ({ ...s, earningsAnalyses: s.earningsAnalyses.filter((a) => a.id !== id) })),
      openInModelBuilder,
      requestOpenInModelBuilder: (ticker) => {
        setOpenInModelBuilder(ticker);
        setActiveModule('model');
      },
      clearOpenInModelBuilder: () => setOpenInModelBuilder(null),
    }),
    [state, activeModule, openInModelBuilder],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}
